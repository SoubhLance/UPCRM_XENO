from sqlalchemy.orm import Session
from models import Customer

def inactive_customers(db: Session, days: int = 90):
    """Returns customers whose days since last order is strictly greater than `days`."""
    return db.query(Customer).filter(Customer.days_since_last_order > days).all()

def vip_customers(db: Session):
    """Returns customers whose total spend is strictly greater than 10000."""
    return db.query(Customer).filter(Customer.total_spent > 10000).all()

def frequent_buyers(db: Session):
    """Returns customers whose total order count is strictly greater than 20."""
    return db.query(Customer).filter(Customer.total_orders > 20).all()

def electronics_lovers(db: Session):
    """Returns customers whose favorite category is Electronics."""
    return db.query(Customer).filter(Customer.favorite_category == "Electronics").all()

def high_value_customers(db: Session):
    """Returns customers whose total spent is strictly greater than 5000."""
    return db.query(Customer).filter(Customer.total_spent > 5000).all()
