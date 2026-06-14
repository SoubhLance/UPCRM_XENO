from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Order
from schemas import OrderSchema
from services.ingest_service import ingest_orders
from typing import List

router = APIRouter(tags=["Orders"])

@router.get("/orders", response_model=List[OrderSchema])
def get_orders(
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).offset(offset).limit(limit).all()
    return orders

@router.post("/ingest/orders", status_code=status.HTTP_201_CREATED)
def trigger_ingest_orders(db: Session = Depends(get_db)):
    res = ingest_orders(db)
    if "error" in res:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res["error"]
        )
    return res
