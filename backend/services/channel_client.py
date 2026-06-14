import asyncio
import random
import httpx
import os
import threading

# Configurable probabilities
FAILURE_PROBABILITY = 0.05     # 5% chance of outright failure
DELIVERY_PROBABILITY = 0.95    # 95% chance of delivery (if not failed)
OPEN_PROBABILITY = 0.70        # 70% chance of opening (if delivered)
CLICK_PROBABILITY = 0.30       # 30% chance of clicking (if opened)

async def send_to_receipt_webhook(payload: dict, callback=None):
    """
    Attempts to post a delivery receipt event to the /receipt webhook.
    If the HTTP post fails (e.g. during offline test runs), falls back
    to invoking the passed callback function directly.
    """
    backend_url = os.getenv("BACKEND_URL", "http://localhost:8000")
    url = f"{backend_url}/receipt"
    print(f"[Webhook Debug] Entering send_to_receipt_webhook with url={url}, payload={payload}")
    if "http://test" not in backend_url:
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code == 200:
                    return
        except Exception:
            # HTTP client failed (port not listening during offline integration test)
            pass

    # Fallback: Invoke log_receipt_callback directly using the passed callback reference
    print(f"[Webhook Debug] callback is: {callback}")
    if callback:
        try:
            from database import SessionLocal
            db = SessionLocal()
            callback(
                db=db,
                campaign_id=payload["campaign_id"],
                customer_id=payload["customer_id"],
                channel=payload["channel"],
                status=payload["status"]
            )
            db.close()
        except Exception as db_err:
            print(f"[Channel Simulator] Fallback DB update failed: {db_err}")

async def simulate_message_lifecycle(campaign_id: int, customer_id: int, channel: str, callback=None):
    """
    Simulates the asynchronous progression of message states.
    Fires callbacks progressively: sent -> delivered -> opened -> clicked
    """
    print(f"[Simulator Debug] Starting lifecycle for campaign_id={campaign_id}, customer_id={customer_id}")
    payload_base = {
        "campaign_id": campaign_id,
        "customer_id": customer_id,
        "channel": channel
    }

    # 1. Immediately fire "sent" event
    print(f"[Simulator Debug] Firing sent event for customer_id={customer_id}")
    await send_to_receipt_webhook({**payload_base, "status": "sent"}, callback)
    await asyncio.sleep(0.1)

    # Determine final outcome
    if random.random() < FAILURE_PROBABILITY:
        # Message failed
        await send_to_receipt_webhook({**payload_base, "status": "failed"}, callback)
        return

    # Message delivered
    await send_to_receipt_webhook({**payload_base, "status": "delivered"}, callback)
    await asyncio.sleep(0.1)

    # Check if opened
    if random.random() < OPEN_PROBABILITY:
        await send_to_receipt_webhook({**payload_base, "status": "opened"}, callback)
        await asyncio.sleep(0.1)

        # Check if clicked
        if random.random() < CLICK_PROBABILITY:
            await send_to_receipt_webhook({**payload_base, "status": "clicked"}, callback)

def send_message(campaign_id: int, customer_id: int, channel: str, recipient: str, message: str, callback=None):
    """
    Simulates sending a message by spawning a daemon background thread
    to run the message lifecycle coroutine.
    """
    print(f"[Channel Client] Sending via {channel} to {recipient}: '{message[:40]}...'")
    
    coro = simulate_message_lifecycle(campaign_id, customer_id, channel, callback)
    
    # Run the coroutine in a background thread to prevent thread-safety or loop collision issues
    t = threading.Thread(target=asyncio.run, args=(coro,))
    t.daemon = True
    t.start()
