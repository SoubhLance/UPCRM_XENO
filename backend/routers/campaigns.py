from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from database import get_db
from models import Campaign, CampaignEvent, Customer
from schemas import CampaignSchema, CampaignCreateSchema
import services.campaign_service as campaign_service
import services.analytics_service as analytics_service
from typing import List, Optional
import re

router = APIRouter(tags=["Campaigns"])

@router.get("/campaigns")
def get_campaigns(
    search: Optional[str] = None,
    channel: Optional[str] = None,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Campaign)
    if search:
        query = query.filter(Campaign.campaign_name.ilike(f"%{search}%"))
    if channel:
        query = query.filter(Campaign.channel == channel)
    if status:
        query = query.filter(Campaign.status == status)
        
    campaigns = query.order_by(Campaign.created_at.desc()).all()
    results = []
    for c in campaigns:
        analytics = analytics_service.get_campaign_analytics(db, c.campaign_id)
        results.append(analytics)
    return results

@router.get("/campaigns/{campaign_id}")
def get_campaign(campaign_id: int, db: Session = Depends(get_db)):
    analytics = analytics_service.get_campaign_analytics(db, campaign_id)
    if "error" in analytics:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=analytics["error"]
        )
    return analytics

@router.post("/campaign/create", response_model=CampaignSchema, status_code=status.HTTP_201_CREATED)
def create_campaign(body: CampaignCreateSchema, db: Session = Depends(get_db)):
    try:
        campaign = campaign_service.create_and_launch_campaign(
            db=db,
            campaign_name=body.campaign_name,
            segment=body.segment,
            channel=body.channel,
            message=body.message
        )
        return campaign
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to create campaign: {str(e)}"
        )

@router.get("/campaign-events")
def get_campaign_events(
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(CampaignEvent)
    
    if search:
        # Join Customer and Campaign to search by customer name, campaign name, status, or channel
        query = query.join(Customer).join(Campaign).filter(
            Customer.name.ilike(f"%{search}%") |
            Campaign.campaign_name.ilike(f"%{search}%") |
            CampaignEvent.channel.ilike(f"%{search}%") |
            CampaignEvent.status.ilike(f"%{search}%")
        )
        
    events = query.order_by(CampaignEvent.event_time.desc()).offset(offset).limit(limit).all()
    
    results = []
    for e in events:
        customer_name = e.customer.name if e.customer else f"Customer #{e.customer_id}"
        message = e.campaign.message if e.campaign else ""
        
        # Determine offer code from campaign message
        offer_code = "N/A"
        if message:
            match = re.search(r'(\d+%)', message)
            if match:
                offer_code = f"SAVE{match.group(1).replace('%', '')}"
            elif "miss" in message.lower():
                offer_code = "MISSYOU"
            else:
                offer_code = "UPCRM10"
                
        template_name = f"{e.campaign.campaign_name} Template" if e.campaign else f"Template {e.channel.upper()}"
        
        results.append({
            "event_id": e.event_id,
            "campaign_id": e.campaign_id,
            "customer_id": e.customer_id,
            "channel": e.channel,
            "status": e.status,
            "event_time": e.event_time.isoformat() if e.event_time else None,
            "message": message,
            "offer_code": offer_code,
            "template_name": template_name,
            "customer_name": customer_name
        })
    return results
