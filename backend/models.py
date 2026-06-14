from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email_addr = Column(String, nullable=True)
    channel_preference = Column(String, nullable=True)
    segment = Column(String, nullable=True)
    total_orders = Column(Integer, default=0)
    total_spent = Column(Float, default=0.0)
    avg_order_value = Column(Float, default=0.0)
    favorite_category = Column(String, nullable=True)
    last_order_date = Column(String, nullable=True)
    days_since_last_order = Column(Integer, default=0)
    churn = Column(Integer, default=0)
    last_contacted = Column(String, nullable=True)
    last_campaign_id = Column(Integer, nullable=True)
    communication_status = Column(String, nullable=True)

    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    events = relationship("CampaignEvent", back_populates="customer", cascade="all, delete-orphan")


class Order(Base):
    __tablename__ = "orders"

    order_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True, nullable=False)
    purchase_date = Column(String, nullable=True)
    product_category = Column(String, nullable=True)
    product_price = Column(Float, nullable=True)
    quantity = Column(Integer, default=1)
    total_amount = Column(Float, default=0.0)
    payment_method = Column(String, nullable=True)
    returned = Column(Boolean, default=False)

    customer = relationship("Customer", back_populates="orders")


class Campaign(Base):
    __tablename__ = "campaigns"

    campaign_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    campaign_name = Column(String, nullable=False)
    segment = Column(String, nullable=True)
    channel = Column(String, nullable=True)
    message = Column(Text, nullable=True)
    status = Column(String, default="draft")
    created_at = Column(DateTime, server_default=func.now())
    sent_count = Column(Integer, default=0)
    delivered_count = Column(Integer, default=0)
    opened_count = Column(Integer, default=0)
    clicked_count = Column(Integer, default=0)
    failed_count = Column(Integer, default=0)

    events = relationship("CampaignEvent", back_populates="campaign", cascade="all, delete-orphan")


class CampaignEvent(Base):
    __tablename__ = "campaign_events"

    event_id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.campaign_id"), index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.customer_id"), index=True, nullable=False)
    channel = Column(String, nullable=False)
    status = Column(String, nullable=False)  # sent, delivered, opened, clicked, failed
    event_time = Column(DateTime, server_default=func.now())

    campaign = relationship("Campaign", back_populates="events")
    customer = relationship("Customer", back_populates="events")
