from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CustomerSchema(BaseModel):
    customer_id: int
    name: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    email_addr: Optional[str] = None
    channel_preference: Optional[str] = None
    segment: Optional[str] = None
    total_orders: int
    total_spent: float
    avg_order_value: float
    favorite_category: Optional[str] = None
    last_order_date: Optional[str] = None
    days_since_last_order: int
    churn: int
    last_contacted: Optional[str] = None
    last_campaign_id: Optional[int] = None
    communication_status: Optional[str] = None

    class Config:
        from_attributes = True


class OrderSchema(BaseModel):
    order_id: int
    customer_id: int
    purchase_date: Optional[str] = None
    product_category: Optional[str] = None
    product_price: float
    quantity: int
    total_amount: float
    payment_method: Optional[str] = None
    returned: bool

    class Config:
        from_attributes = True


class CampaignCreateSchema(BaseModel):
    campaign_name: str
    segment: str
    channel: str
    message: str


class CampaignSchema(BaseModel):
    campaign_id: int
    campaign_name: str
    segment: Optional[str] = None
    channel: Optional[str] = None
    message: Optional[str] = None
    status: str
    created_at: datetime
    sent_count: int
    delivered_count: int
    opened_count: int
    clicked_count: int
    failed_count: int

    class Config:
        from_attributes = True


class CampaignEventSchema(BaseModel):
    event_id: int
    campaign_id: int
    customer_id: int
    channel: str
    status: str
    event_time: datetime

    class Config:
        from_attributes = True


class ChatMessage(BaseModel):
    message: str


class ReceiptSchema(BaseModel):
    campaign_id: int
    customer_id: int
    channel: str
    status: str
