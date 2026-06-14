import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal, engine
from models import Base
from services.ingest_service import ingest_customers, ingest_orders

def seed():
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    print("Running customer ingestion...")
    cust_res = ingest_customers(db)
    print("Customer Ingestion Result:", cust_res)

    print("Running order ingestion...")
    order_res = ingest_orders(db)
    print("Order Ingestion Result:", order_res)

    db.close()
    print("Seeding execution complete!")

if __name__ == "__main__":
    seed()
