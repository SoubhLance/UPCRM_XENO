from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import Customer, Order, Campaign, CampaignEvent

router = APIRouter(tags=["Analytics"])

@router.get("/analytics")
def get_analytics(db: Session = Depends(get_db)):
    # 1. Total Customers
    total_customers = db.query(Customer).count()
    
    # 2. Active Customers (days_since_last_order < 90)
    active_customers = db.query(Customer).filter(Customer.days_since_last_order < 90).count()
    
    # 3. Inactive Customers (days_since_last_order >= 90)
    inactive_customers = total_customers - active_customers
    
    # 4. Total Campaigns
    total_campaigns = db.query(Campaign).count()
    
    # 5. Emails Sent (sum of Campaign.sent_count)
    emails_sent = db.query(func.sum(Campaign.sent_count)).scalar() or 0
    
    # 6. Total Revenue (sum of Order.total_amount)
    total_revenue = db.query(func.sum(Order.total_amount)).scalar() or 0.0

    # 7. Total Orders
    total_orders = db.query(Order).count()

    # Donut Chart: Active vs Inactive
    active_vs_inactive = [
        {"name": "Active", "value": active_customers},
        {"name": "Inactive", "value": inactive_customers}
    ]

    # Sales Trend: Line chart (grouped by date)
    # Take the last 30 dates of orders to make a clean line chart
    sales_trend_query = db.query(
        Order.purchase_date,
        func.sum(Order.total_amount).label("revenue")
    ).group_by(Order.purchase_date).order_by(Order.purchase_date).all()
    
    sales_trend = [{"date": s[0], "revenue": round(s[1], 2)} for s in sales_trend_query if s[0]]
    if len(sales_trend) > 30:
        sales_trend = sales_trend[-30:]

    # Campaign Performance: Bar chart (last 8 campaigns)
    campaigns = db.query(Campaign).order_by(Campaign.created_at.desc()).limit(8).all()
    campaign_performance = []
    for c in campaigns:
        campaign_performance.append({
            "name": c.campaign_name[:12] if c.campaign_name else f"Camp #{c.campaign_id}",
            "Sent": c.sent_count,
            "Delivered": c.delivered_count,
            "Opened": c.opened_count,
            "Clicked": c.clicked_count
        })
    campaign_performance.reverse()

    # Delivery Funnel: Sent -> Delivered -> Opened -> Clicked
    sent_cnt = db.query(func.sum(Campaign.sent_count)).scalar() or 0
    delivered_cnt = db.query(func.sum(Campaign.delivered_count)).scalar() or 0
    opened_cnt = db.query(func.sum(Campaign.opened_count)).scalar() or 0
    clicked_cnt = db.query(func.sum(Campaign.clicked_count)).scalar() or 0

    delivery_funnel = [
        {"stage": "Sent", "value": sent_cnt},
        {"stage": "Delivered", "value": delivered_cnt},
        {"stage": "Opened", "value": opened_cnt},
        {"stage": "Clicked", "value": clicked_cnt}
    ]

    # Segment Distribution: Pie chart
    segment_query = db.query(
        Customer.segment,
        func.count(Customer.customer_id).label("count")
    ).group_by(Customer.segment).all()
    segment_distribution = [{"name": (s[0] or "Unknown").title(), "value": s[1]} for s in segment_query if s[0]]

    # Top Categories: Horizontal bar chart
    category_query = db.query(
        Order.product_category,
        func.sum(Order.total_amount).label("revenue")
    ).group_by(Order.product_category).order_by(func.sum(Order.total_amount).desc()).limit(10).all()
    top_categories = [{"name": (c[0] or "Other").title(), "value": round(c[1], 2)} for c in category_query if c[0]]

    # Recent Campaigns Table (last 6 campaigns)
    recent_campaigns = []
    campaigns_all = db.query(Campaign).order_by(Campaign.created_at.desc()).limit(6).all()
    for c in campaigns_all:
        recent_campaigns.append({
            "campaign_name": c.campaign_name,
            "sent_count": c.sent_count,
            "delivered_count": c.delivered_count,
            "opened_count": c.opened_count,
            "clicked_count": c.clicked_count,
            "failed_count": c.failed_count,
            "status": c.status
        })

    return {
        "kpis": {
            "total_customers": total_customers,
            "active_customers": active_customers,
            "inactive_customers": inactive_customers,
            "total_campaigns": total_campaigns,
            "emails_sent": emails_sent,
            "total_revenue": round(total_revenue, 2),
            "total_orders": total_orders
        },
        "charts": {
            "active_vs_inactive": active_vs_inactive,
            "sales_trend": sales_trend,
            "campaign_performance": campaign_performance,
            "delivery_funnel": delivery_funnel,
            "segment_distribution": segment_distribution,
            "top_categories": top_categories
        },
        "recent_campaigns": recent_campaigns
    }
