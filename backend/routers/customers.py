from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from models import Customer
from schemas import CustomerSchema
from services.ingest_service import ingest_customers
from typing import List, Optional

router = APIRouter(tags=["Customers"])

@router.get("/customers", response_model=List[CustomerSchema])
def get_customers(
    segment: Optional[str] = None,
    channel: Optional[str] = None,
    days_inactive_min: Optional[int] = None,
    search: Optional[str] = None,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    query = db.query(Customer)
    if segment:
        query = query.filter(Customer.segment == segment)
    if channel:
        query = query.filter(Customer.channel_preference == channel)
    if days_inactive_min:
        query = query.filter(Customer.days_since_last_order >= days_inactive_min)
    if search:
        query = query.filter(
            Customer.name.ilike(f"%{search}%") |
            Customer.email_addr.ilike(f"%{search}%") |
            Customer.phone.ilike(f"%{search}%")
        )
    
    customers = query.offset(offset).limit(limit).all()
    return customers

@router.get("/customers/{customer_id}", response_model=CustomerSchema)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found"
        )
    return customer

@router.post("/ingest/customers", status_code=status.HTTP_201_CREATED)
def trigger_ingest_customers(db: Session = Depends(get_db)):
    res = ingest_customers(db)
    if "error" in res:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=res["error"]
        )
    return res
