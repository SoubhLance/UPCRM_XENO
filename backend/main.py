from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine
from models import Base
from routers import chat, customers, orders, campaigns, receipt, analytics

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="UPCRM Backend MVP", 
    description="Backend API for customer segmentation, campaign automation, and AI copilot marketing.",
    version="1.0"
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(chat.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(campaigns.router)
app.include_router(receipt.router)
app.include_router(analytics.router)

@app.get("/")
def health():
    return {"status": "ok", "service": "UPCRM Backend"}
