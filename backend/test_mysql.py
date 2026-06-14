from database import SessionLocal
from models import Customer, Order, Campaign, CampaignEvent

def main():
    db = SessionLocal()
    try:
        customers_cnt = db.query(Customer).count()
        orders_cnt = db.query(Order).count()
        campaigns_cnt = db.query(Campaign).count()
        events_cnt = db.query(CampaignEvent).count()
        
        print(f"Customers: {customers_cnt}")
        print(f"Orders: {orders_cnt}")
        print(f"Campaigns: {campaigns_cnt}")
        print(f"CampaignEvents: {events_cnt}")
    except Exception as e:
        print(f"Failed to query MySQL tables: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    main()
