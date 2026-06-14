import json
from sqlalchemy.orm import Session
from models import Customer, Campaign, CampaignEvent
from datetime import datetime
import os
import httpx
import services.campaign_service as campaign_service
import services.analytics_service as analytics_service

# Unified tool schemas in standard OpenAI/compatibility format
tools = [
    {
        "type": "function",
        "function": {
            "name": "query_segment",
            "description": "Query customer segment statistics from the database based on filters like days_since_last_order, segment, total_spent, channel_preference, favorite_category, churn status etc. Returns segment summary stats (customer count, average spend) instead of individual customer records.",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_inactive_min": {"type": "integer", "description": "Minimum days since last order"},
                    "days_inactive_max": {"type": "integer", "description": "Maximum days since last order"},
                    "segment": {"type": "string", "description": "Customer segment: churned/at_risk/loyal/high_spender/new/regular"},
                    "channel_preference": {"type": "string", "description": "Filter by channel: whatsapp/sms/email"},
                    "min_total_spent": {"type": "number", "description": "Minimum total amount spent"},
                    "max_total_spent": {"type": "number", "description": "Maximum total amount spent"},
                    "favorite_category": {"type": "string", "description": "Filter by favorite category: Home/Electronics/Books/Clothing"},
                    "churn": {"type": "integer", "description": "0 = active, 1 = churned"},
                    "limit": {"type": "integer", "description": "Max customers to target (ignored, as stats are summarized)"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "preview_segment",
            "description": "Preview how many customers match the filter criteria before sending",
            "parameters": {
                "type": "object",
                "properties": {
                    "days_inactive_min": {"type": "integer"},
                    "days_inactive_max": {"type": "integer"},
                    "segment": {"type": "string"},
                    "channel_preference": {"type": "string"},
                    "min_total_spent": {"type": "number"},
                    "max_total_spent": {"type": "number"},
                    "favorite_category": {"type": "string"},
                    "churn": {"type": "integer"}
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_and_launch_campaign",
            "description": "Create a campaign and send personalized messages to the targeted customers (resolved automatically on the backend using filters or segment)",
            "parameters": {
                "type": "object",
                "properties": {
                    "campaign_name": {"type": "string", "description": "Name of the campaign"},
                    "message_template": {"type": "string", "description": "Message template. Use {name}, {favorite_category}, {days_since_last_order} as placeholders"},
                    "channel": {"type": "string", "description": "Channel to use: whatsapp/sms/email. Use customer's preference if 'auto'"},
                    "customer_ids": {"type": "array", "items": {"type": "integer"}, "description": "Optional: List of customer_ids to target. If not provided, segment/filters will be used instead."},
                    "segment": {"type": "string", "description": "Optional: Target segment name (e.g. 'high_value_customers', 'inactive_customers')"},
                    "days_inactive_min": {"type": "integer", "description": "Optional: Filter by minimum days since last order"},
                    "days_inactive_max": {"type": "integer", "description": "Optional: Filter by maximum days since last order"},
                    "channel_preference": {"type": "string", "description": "Optional: Filter by channel preference"},
                    "min_total_spent": {"type": "number", "description": "Optional: Filter by minimum total spent"},
                    "max_total_spent": {"type": "number", "description": "Optional: Filter by maximum total spent"},
                    "favorite_category": {"type": "string", "description": "Optional: Filter by favorite category"},
                    "churn": {"type": "integer", "description": "Optional: Filter by churn status (0/1)"},
                    "goal": {"type": "string", "description": "Original campaign goal"}
                },
                "required": ["campaign_name", "message_template", "channel", "goal"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_campaign_stats",
            "description": "Get performance statistics for a campaign",
            "parameters": {
                "type": "object",
                "properties": {
                    "campaign_id": {"type": "integer", "description": "Campaign ID to fetch stats for"}
                },
                "required": ["campaign_id"]
            }
        }
    }
]


def apply_filters(query, params: dict):
    if params.get("days_inactive_min"):
        query = query.filter(Customer.days_since_last_order >= params["days_inactive_min"])
    if params.get("days_inactive_max"):
        query = query.filter(Customer.days_since_last_order <= params["days_inactive_max"])
    if params.get("segment"):
        query = query.filter(Customer.segment == params["segment"])
    if params.get("channel_preference"):
        query = query.filter(Customer.channel_preference == params["channel_preference"])
    if params.get("min_total_spent"):
        query = query.filter(Customer.total_spent >= params["min_total_spent"])
    if params.get("max_total_spent"):
        query = query.filter(Customer.total_spent <= params["max_total_spent"])
    if params.get("favorite_category"):
        query = query.filter(Customer.favorite_category == params["favorite_category"])
    if params.get("churn") is not None:
        query = query.filter(Customer.churn == params["churn"])
    return query


def execute_tool(tool_name: str, tool_input: dict, db: Session, goal: str = ""):
    if tool_name == "preview_segment":
        query = db.query(Customer)
        query = apply_filters(query, tool_input)
        count = query.count()
        segments = {}
        for c in query.limit(500).all():
            segments[c.segment] = segments.get(c.segment, 0) + 1
        channels = {}
        for c in query.limit(500).all():
            channels[c.channel_preference] = channels.get(c.channel_preference, 0) + 1
        return {"total_customers": count, "segment_breakdown": segments, "channel_breakdown": channels}

    elif tool_name == "query_segment":
        from sqlalchemy import func
        query = db.query(Customer)
        query = apply_filters(query, tool_input)
        customer_count = query.count()
        
        avg_query = db.query(func.avg(Customer.total_spent))
        avg_query = apply_filters(avg_query, tool_input)
        avg_spend_val = avg_query.scalar()
        avg_spend = round(float(avg_spend_val), 2) if avg_spend_val is not None else 0.0
        
        segment_name = tool_input.get("segment") or "custom_segment"
        
        return {
            "customer_count": customer_count,
            "avg_spend": avg_spend,
            "segment": segment_name
        }

    elif tool_name == "create_and_launch_campaign":
        customer_ids = tool_input.get("customer_ids")
        segment_name = tool_input.get("segment") or "auto"
        
        if not customer_ids:
            # Check for filter criteria in tool_input
            filter_keys = ["days_inactive_min", "days_inactive_max", "segment", "channel_preference", "min_total_spent", "max_total_spent", "favorite_category", "churn"]
            has_filters = any(k in tool_input for k in filter_keys)
            
            if has_filters:
                query = db.query(Customer)
                query = apply_filters(query, tool_input)
                # Cap targeting at 100 for safety, similar to standard campaign creation
                customers = query.limit(100).all()
                customer_ids = [c.customer_id for c in customers]
            elif tool_input.get("segment"):
                customers = campaign_service.get_target_customers(db, tool_input["segment"])
                customer_ids = [c.customer_id for c in customers[:100]]
            else:
                customer_ids = []

        campaign = campaign_service.create_campaign_for_customers(
            db=db,
            campaign_name=tool_input["campaign_name"],
            segment_name=segment_name,
            channel=tool_input["channel"],
            message=tool_input["message_template"],
            customer_ids=customer_ids
        )
        return {
            "campaign_id": campaign.campaign_id,
            "campaign_name": campaign.campaign_name,
            "total_sent": len(customer_ids),
            "status": campaign.status,
            "message": f"Campaign launched! Sending to {len(customer_ids)} customers via their preferred channels."
        }

    elif tool_name == "get_campaign_stats":
        campaign_id = tool_input["campaign_id"]
        analytics = analytics_service.get_campaign_analytics(db, campaign_id)
        if "error" in analytics:
            return analytics
        return {
            "campaign_id": campaign_id,
            "campaign_name": analytics["campaign_name"],
            "total_targeted": analytics["counts"]["sent"],
            "stats": {
                "sent": analytics["counts"]["sent"],
                "delivered": analytics["counts"]["delivered"],
                "opened": analytics["counts"]["opened"],
                "clicked": analytics["counts"]["clicked"],
                "failed": analytics["counts"]["failed"]
            },
            "delivery_rate": f"{analytics['rates']['delivery_rate']}%",
            "open_rate": f"{analytics['rates']['open_rate']}%",
            "click_rate": f"{analytics['rates']['ctr']}%"
        }


async def call_llm_with_fallback(messages: list, tools_schema: list = None, system_prompt: str = None) -> dict:
    """
    Executes a chat completion request, trying Gemini 2.5 Flash first and automatically falling back to Groq
    if Gemini fails, times out, or errors out.
    """
    gemini_key = os.getenv("GEMINI_API_KEY")
    groq_key = os.getenv("GROQ_API_KEY")

    # Construct unified message list
    formatted_messages = []
    if system_prompt:
        formatted_messages.append({"role": "system", "content": system_prompt})
    
    # Map messages to standard API structures
    for msg in messages:
        formatted_msg = {"role": msg["role"]}
        if "content" in msg and msg["content"] is not None:
            formatted_msg["content"] = msg["content"]
        if "tool_calls" in msg:
            formatted_msg["tool_calls"] = msg["tool_calls"]
        if "tool_call_id" in msg:
            formatted_msg["tool_call_id"] = msg["tool_call_id"]
        if "name" in msg:
            formatted_msg["name"] = msg["name"]
        formatted_messages.append(formatted_msg)

    payload = {
        "messages": formatted_messages,
        "temperature": 0.2
    }
    if tools_schema:
        payload["tools"] = tools_schema
        payload["tool_choice"] = "auto"

    # Attempt Gemini first
    if gemini_key and gemini_key != "your_gemini_key_here":
        try:
            print("[LLM Service] Dispatching call to primary provider: Gemini 2.5 Flash...")
            headers = {
                "Authorization": f"Bearer {gemini_key}",
                "Content-Type": "application/json"
            }
            # Set Gemini model (using gemini-2.5-flash)
            gemini_payload = {**payload, "model": "gemini-2.5-flash"}
            
            # Using 12-second timeout to trigger fallback quickly if Gemini hangs
            async with httpx.AsyncClient(timeout=12.0) as client:
                response = await client.post(
                    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
                    headers=headers,
                    json=gemini_payload
                )
                response.raise_for_status()
                data = response.json()
                print("[LLM Service] Gemini call succeeded.")
                return data["choices"][0]["message"]
        except Exception as e:
            print(f"[LLM Service] Gemini failed ({e}). Retrying with Groq...")

    # Fallback to Groq
    if groq_key and groq_key != "your_groq_key_here":
        try:
            print("[LLM Service] Dispatching call to fallback provider: Groq...")
            headers = {
                "Authorization": f"Bearer {groq_key}",
                "Content-Type": "application/json"
            }
            # Set Groq model
            groq_payload = {**payload, "model": "llama-3.3-70b-versatile"}
            
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=headers,
                    json=groq_payload
                )
                response.raise_for_status()
                data = response.json()
                print("[LLM Service] Groq call succeeded.")
                return data["choices"][0]["message"]
        except Exception as e:
            print(f"[LLM Service] Groq failed: {e}")
            raise RuntimeError(f"All LLM providers failed. Groq error: {e}")
    else:
        raise RuntimeError("No valid Gemini or Groq API keys configured.")


async def run_agent(user_message: str, db: Session):
    messages = [{"role": "user", "content": user_message}]
    response_text = ""

    system_prompt = """You are an AI marketing agent for a CRM system. 
You help marketers reach their customers intelligently.

When a marketer gives you a goal like "re-engage customers who haven't bought in 90 days":
1. First use preview_segment or query_segment to find matching customers and show the marketer the audience size.
2. Draft a personalized, warm message template using {name}, {favorite_category}, {days_since_last_order} as placeholders.
3. Call create_and_launch_campaign to launch it.
4. Confirm success with campaign details.

Always be conversational, explain what you're doing at each step.
For inactive customers, use channel='auto' to respect their preferences.
Keep messages friendly, personal and include a clear offer/CTA."""

    while True:
        # Call LLM with fallback
        assistant_message = await call_llm_with_fallback(messages, tools_schema=tools, system_prompt=system_prompt)
        
        # Append assistant message to history
        messages.append(assistant_message)
        
        # Capture assistant text
        content = assistant_message.get("content")
        if content:
            response_text += content

        tool_calls = assistant_message.get("tool_calls")
        if not tool_calls:
            # Loop breaks when model returns no tool calls
            break

        # Process requested tool calls
        for tool_call in tool_calls:
            tool_name = tool_call["function"]["name"]
            tool_input = json.loads(tool_call["function"]["arguments"])
            print(f"[Agent] Executing tool: {tool_name} with {tool_input}")
            
            result = execute_tool(tool_name, tool_input, db, user_message)
            
            # Format and append tool result back into history
            messages.append({
                "role": "tool",
                "tool_call_id": tool_call["id"],
                "name": tool_name,
                "content": json.dumps(result)
            })

    return response_text
