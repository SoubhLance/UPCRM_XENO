from sqlalchemy.orm import Session
from models import Campaign, Customer, CampaignEvent
import services.segmentation_service as seg_service
import services.channel_client as channel_client
from datetime import datetime
import asyncio
import threading

def get_target_customers(db: Session, segment: str):
    """
    Resolves a segment identifier string to a list of matching Customer records.
    """
    cleaned_segment = segment.strip().lower()
    
    if cleaned_segment == "inactive_customers":
        return seg_service.inactive_customers(db, days=90)
    elif cleaned_segment == "vip_customers":
        return seg_service.vip_customers(db)
    elif cleaned_segment == "frequent_buyers":
        return seg_service.frequent_buyers(db)
    elif cleaned_segment == "electronics_lovers":
        return seg_service.electronics_lovers(db)
    elif cleaned_segment == "high_value_customers":
        return seg_service.high_value_customers(db)
    
    # Fallback 1: Match segment column exactly (e.g. 'at_risk', 'churned')
    db_customers = db.query(Customer).filter(Customer.segment == segment).all()
    if db_customers:
        return db_customers
        
    # Fallback 2: Check case-insensitive match on segment column
    db_customers_lower = db.query(Customer).filter(Customer.segment.ilike(segment)).all()
    if db_customers_lower:
        return db_customers_lower

    # Fallback 3: Return all customers
    return db.query(Customer).all()

async def dispatch_campaign_async(campaign_id: int, customer_ids: list, channel: str, message: str):
    """
    Asynchronously dispatches all messages for a campaign concurrently
    on a single event loop, preventing connection lock contention in SQLite.
    """
    from database import SessionLocal
    db = SessionLocal()
    
    tasks = []
    for cust_id in customer_ids:
        customer = db.query(Customer).filter(Customer.customer_id == cust_id).first()
        if not customer:
            continue

        # Determine communication channel
        comm_channel = channel.strip().lower() if channel else "auto"
        if comm_channel == "auto" or not comm_channel:
            comm_channel = customer.channel_preference or "email"
            
        if comm_channel not in ("whatsapp", "sms", "email"):
            comm_channel = "email"

        # Personalize template
        personalized_msg = message
        if "{name}" in personalized_msg:
            personalized_msg = personalized_msg.replace("{name}", customer.name or "Customer")
        if "{favorite_category}" in personalized_msg:
            personalized_msg = personalized_msg.replace("{favorite_category}", customer.favorite_category or "our products")
        if "{days_since_last_order}" in personalized_msg:
            personalized_msg = personalized_msg.replace("{days_since_last_order}", str(customer.days_since_last_order or 0))

        # Select target contact
        recipient = customer.email_addr
        if comm_channel in ("whatsapp", "sms"):
            recipient = customer.phone or customer.email_addr

        print(f"[Channel Client] Sending via {comm_channel} to {recipient}: '{personalized_msg[:40]}...'")

        # Schedule async message lifecycle simulation
        tasks.append(
            asyncio.create_task(
                channel_client.simulate_message_lifecycle(
                    campaign_id=campaign_id,
                    customer_id=cust_id,
                    channel=comm_channel,
                    callback=log_receipt_callback
                )
            )
        )
        
    db.close()
    
    # Execute all simulations concurrently in the background loop
    if tasks:
        await asyncio.gather(*tasks)

def run_campaign_dispatch_in_background(campaign_id: int, customer_ids: list, channel: str, message: str):
    """
    Target function for the background thread to run the async dispatch loop.
    """
    asyncio.run(dispatch_campaign_async(campaign_id, customer_ids, channel, message))

def create_and_launch_campaign(db: Session, campaign_name: str, segment: str, channel: str, message: str) -> Campaign:
    """
    Creates a campaign and launches it in a single background worker thread.
    """
    customers = get_target_customers(db, segment)
    targeted_customers = customers[:100]  # Limit to 100 for safety

    campaign = Campaign(
        campaign_name=campaign_name,
        segment=segment,
        channel=channel,
        message=message,
        status="running",
        sent_count=0,
        delivered_count=0,
        opened_count=0,
        clicked_count=0,
        failed_count=0
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Spawn single background worker thread for campaign dispatch
    t = threading.Thread(
        target=run_campaign_dispatch_in_background,
        args=(campaign.campaign_id, [c.customer_id for c in targeted_customers], channel, message)
    )
    t.daemon = True
    t.start()

    return campaign

def create_campaign_for_customers(db: Session, campaign_name: str, segment_name: str, channel: str, message: str, customer_ids: list) -> Campaign:
    """
    Creates and launches a campaign targeting a specific list of customer IDs.
    """
    campaign = Campaign(
        campaign_name=campaign_name,
        segment=segment_name,
        channel=channel,
        message=message,
        status="running",
        sent_count=0,
        delivered_count=0,
        opened_count=0,
        clicked_count=0,
        failed_count=0
    )
    db.add(campaign)
    db.commit()
    db.refresh(campaign)

    # Spawn single background worker thread for campaign dispatch
    t = threading.Thread(
        target=run_campaign_dispatch_in_background,
        args=(campaign.campaign_id, customer_ids, channel, message)
    )
    t.daemon = True
    t.start()

    return campaign

def log_receipt_callback(db: Session, campaign_id: int, customer_id: int, channel: str, status: str) -> dict:
    """
    Processes a delivery status receipt webhook call.
    - Updates Customer.communication_status, Customer.last_contacted, Customer.last_campaign_id
    - Increments corresponding Campaign counters
    - Inserts a new record into CampaignEvent (preventing exact duplicates)
    """
    print(f"[Callback Debug] Triggered for campaign_id={campaign_id}, customer_id={customer_id}, status={status}")
    # 1. Verify customer and campaign exist
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    campaign = db.query(Campaign).filter(Campaign.campaign_id == campaign_id).first()
    
    if not customer:
        print(f"[Callback Debug] Customer {customer_id} not found!")
        return {"error": f"Customer {customer_id} not found"}
    if not campaign:
        print(f"[Callback Debug] Campaign {campaign_id} not found!")
        return {"error": f"Campaign {campaign_id} not found"}

    # 2. Check for duplicate event state to prevent double-counting
    existing_event = db.query(CampaignEvent).filter(
        CampaignEvent.campaign_id == campaign_id,
        CampaignEvent.customer_id == customer_id,
        CampaignEvent.status == status
    ).first()
    
    if existing_event:
        print(f"[Callback Debug] Duplicate event status {status} ignored")
        return {"status": "ignored", "message": "Duplicate event status ignored"}

    # 3. Create CampaignEvent
    event = CampaignEvent(
        campaign_id=campaign_id,
        customer_id=customer_id,
        channel=channel,
        status=status,
        event_time=datetime.now()
    )
    db.add(event)

    # 4. Update Customer record
    customer.communication_status = status
    customer.last_contacted = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    customer.last_campaign_id = campaign_id

    # 5. Update Campaign counter
    status_lower = status.strip().lower()
    if status_lower == "sent":
        campaign.sent_count += 1
    elif status_lower == "delivered":
        campaign.delivered_count += 1
    elif status_lower == "opened":
        campaign.opened_count += 1
    elif status_lower == "clicked":
        campaign.clicked_count += 1
    elif status_lower == "failed":
        campaign.failed_count += 1

    db.commit()
    print(f"[Callback Debug] Successfully logged {status} event for customer_id={customer_id}")
    return {"status": "success", "event_id": event.event_id, "customer_status": status}
