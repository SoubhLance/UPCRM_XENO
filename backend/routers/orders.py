from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, String
from database import get_db
from models import Order
from schemas import OrderSchema
from services.ingest_service import ingest_orders
from typing import List, Optional

router = APIRouter(tags=["Orders"])

@router.get("/orders", response_model=List[OrderSchema])
def get_orders(
    search: Optional[str] = None,
    category: Optional[str] = None,
    returned: Optional[bool] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Order)
    if search:
        query = query.filter(
            Order.product_category.ilike(f"%{search}%") |
            func.cast(Order.customer_id, String).ilike(f"%{search}%") |
            func.cast(Order.order_id, String).ilike(f"%{search}%")
        )
    if category:
        query = query.filter(Order.product_category == category)
    if returned is not None:
        query = query.filter(Order.returned == returned)
        
    orders = query.offset(offset).limit(limit).all()
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
