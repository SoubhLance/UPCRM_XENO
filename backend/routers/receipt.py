from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from schemas import ReceiptSchema
import services.campaign_service as campaign_service

router = APIRouter(tags=["Callbacks"])

@router.post("/receipt", status_code=status.HTTP_200_OK)
def receive_receipt(receipt: ReceiptSchema, db: Session = Depends(get_db)):
    res = campaign_service.log_receipt_callback(
        db=db,
        campaign_id=receipt.campaign_id,
        customer_id=receipt.customer_id,
        channel=receipt.channel,
        status=receipt.status
    )
    if "error" in res:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res["error"]
        )
    return res
