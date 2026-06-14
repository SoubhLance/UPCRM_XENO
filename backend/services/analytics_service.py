from sqlalchemy.orm import Session
from sqlalchemy import func
from models import Campaign, CampaignEvent

def get_campaign_analytics(db: Session, campaign_id: int) -> dict:
    """
    Computes delivery, open, click, and failure rates from CampaignEvent (source of truth).
    """
    campaign = db.query(Campaign).filter(Campaign.campaign_id == campaign_id).first()
    if not campaign:
        return {"error": "Campaign not found"}

    # Count distinct statuses for this campaign
    # We query the count of events for each status
    sent_cnt = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == campaign_id, CampaignEvent.status == "sent").count()
    delivered_cnt = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == campaign_id, CampaignEvent.status == "delivered").count()
    opened_cnt = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == campaign_id, CampaignEvent.status == "opened").count()
    clicked_cnt = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == campaign_id, CampaignEvent.status == "clicked").count()
    failed_cnt = db.query(CampaignEvent).filter(CampaignEvent.campaign_id == campaign_id, CampaignEvent.status == "failed").count()

    # Calculate rates (guard against division by zero)
    delivery_rate = round((delivered_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0
    open_rate = round((opened_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0
    ctr = round((clicked_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0
    failure_rate = round((failed_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0

    return {
        "campaign_id": campaign_id,
        "campaign_name": campaign.campaign_name,
        "status": campaign.status,
        "segment": campaign.segment,
        "channel": campaign.channel,
        "message": campaign.message,
        "created_at": campaign.created_at,
        "sent_count": sent_cnt,
        "delivered_count": delivered_cnt,
        "opened_count": opened_cnt,
        "clicked_count": clicked_cnt,
        "failed_count": failed_cnt,
        "counts": {
            "sent": sent_cnt,
            "delivered": delivered_cnt,
            "opened": opened_cnt,
            "clicked": clicked_cnt,
            "failed": failed_cnt
        },
        "rates": {
            "delivery_rate": delivery_rate,
            "open_rate": open_rate,
            "ctr": ctr,
            "failure_rate": failure_rate
        },
        "funnel": {
            "sent": sent_cnt,
            "delivered": delivered_cnt,
            "opened": opened_cnt,
            "clicked": clicked_cnt
        }
    }

def get_system_analytics(db: Session) -> dict:
    """
    Computes system-wide aggregate stats over all campaigns.
    """
    sent_cnt = db.query(CampaignEvent).filter(CampaignEvent.status == "sent").count()
    delivered_cnt = db.query(CampaignEvent).filter(CampaignEvent.status == "delivered").count()
    opened_cnt = db.query(CampaignEvent).filter(CampaignEvent.status == "opened").count()
    clicked_cnt = db.query(CampaignEvent).filter(CampaignEvent.status == "clicked").count()
    failed_cnt = db.query(CampaignEvent).filter(CampaignEvent.status == "failed").count()

    delivery_rate = round((delivered_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0
    open_rate = round((opened_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0
    ctr = round((clicked_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0
    failure_rate = round((failed_cnt / sent_cnt * 100), 2) if sent_cnt > 0 else 0.0

    return {
        "total_campaigns": db.query(Campaign).count(),
        "aggregate_counts": {
            "sent": sent_cnt,
            "delivered": delivered_cnt,
            "opened": opened_cnt,
            "clicked": clicked_cnt,
            "failed": failed_cnt
        },
        "aggregate_rates": {
            "delivery_rate": delivery_rate,
            "open_rate": open_rate,
            "ctr": ctr,
            "failure_rate": failure_rate
        }
    }
