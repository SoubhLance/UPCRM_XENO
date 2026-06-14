import pandas as pd
from sqlalchemy.orm import Session
from models import Customer, Order
import os

def ingest_customers(db: Session) -> dict:
    """
    Loads customers from customers_enriched.csv, skips existing records
    to prevent duplication, and saves the first 2000 records.
    """
    csv_path = "data/customers_enriched.csv"
    if not os.path.exists(csv_path):
        return {"error": f"CSV file not found at {csv_path}"}
        
    cdf = pd.read_csv(csv_path).head(2000)
    skipped = 0
    added = 0
    
    for _, row in cdf.iterrows():
        cust_id = int(row["customer_id"])
        
        # Check if customer already exists (duplicate prevention)
        existing = db.query(Customer).filter(Customer.customer_id == cust_id).first()
        if existing:
            skipped += 1
            continue

        c = Customer(
            customer_id=cust_id,
            name=str(row["name"]),
            age=int(row["age"]) if pd.notna(row["age"]) else 25,
            gender=str(row["gender"]),
            phone=str(row["phone"]),
            email_addr=str(row["email_addr"]),
            channel_preference=str(row["channel_preference"]),
            segment=str(row["segment"]),
            total_orders=int(row["total_orders"]),
            total_spent=float(row["total_spent"]),
            avg_order_value=float(row["avg_order_value"]),
            favorite_category=str(row["favorite_category"]),
            last_order_date=str(row["last_order_date"]),
            days_since_last_order=int(row["days_since_last_order"]),
            churn=int(row["churn"])
        )
        db.add(c)
        added += 1

    db.commit()
    return {"status": "success", "added": added, "skipped": skipped, "total_in_db": db.query(Customer).count()}

def ingest_orders(db: Session) -> dict:
    """
    Loads orders from orders.csv, skips if orders table is already populated
    (to prevent duplication), and inserts the first 10000 valid orders.
    """
    csv_path = "data/orders.csv"
    if not os.path.exists(csv_path):
        return {"error": f"CSV file not found at {csv_path}"}

    # Deduplication check: if order table is not empty, skip seeding
    existing_count = db.query(Order).count()
    if existing_count >= 10000:
        return {"status": "skipped", "message": f"Order table already has {existing_count} records.", "added": 0, "total_in_db": existing_count}

    odf = pd.read_csv(csv_path).head(10000)
    
    # Get valid customer IDs currently in the database to maintain referential integrity
    valid_cust_ids = set([c.customer_id for c in db.query(Customer.customer_id).all()])
    
    added = 0
    skipped = 0
    
    for _, row in odf.iterrows():
        cust_id = int(row["customer_id"])
        if cust_id not in valid_cust_ids:
            skipped += 1
            continue

        o = Order(
            customer_id=cust_id,
            purchase_date=str(row["purchase_date"]),
            product_category=str(row["product_category"]),
            product_price=float(row["product_price"]),
            quantity=int(row["quantity"]),
            total_amount=float(row["total_amount"]),
            payment_method=str(row["payment_method"]),
            returned=bool(row["returned"]) if pd.notna(row["returned"]) else False
        )
        db.add(o)
        added += 1

    db.commit()
    return {"status": "success", "added": added, "skipped": skipped, "total_in_db": db.query(Order).count()}
