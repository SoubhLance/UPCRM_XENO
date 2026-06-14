from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from schemas import ChatMessage
from services.ai_agent import run_agent

router = APIRouter(tags=["AI Copilot"])

@router.post("/chat")
async def chat(body: ChatMessage, db: Session = Depends(get_db)):
    result = await run_agent(body.message, db)
    return {"response": result}
