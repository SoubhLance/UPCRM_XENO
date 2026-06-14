from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Campaign
from schemas import CampaignSchema, CampaignCreateSchema
import services.campaign_service as campaign_service
import services.analytics_service as analytics_service
from typing import List

router = APIRouter(tags=["Campaigns"])

@router.get("/campaigns")
def get_campaigns(db: Session = Depends(get_db)):
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).all()
    results = []
    for c in campaigns:
        # Populate live analytics for each campaign
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
