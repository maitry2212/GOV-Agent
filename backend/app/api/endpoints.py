from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.agents.research_agent import research_app
from app.schemas.chat import (
    ChatRequest, ChatResponse, ChatSessionResponse, 
    ChatSessionDetail, MessageResponse
)
from app.db.database import get_db
from app.db import models

router = APIRouter()

@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest, db: Session = Depends(get_db)):
    try:
        # 1. Handle Session
        if request.session_id:
            session = db.query(models.ChatSession).filter(models.ChatSession.id == request.session_id).first()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session
            # Use query as initial title
            title = request.query[:30] + "..." if len(request.query) > 30 else request.query
            session = models.ChatSession(title=title)
            db.add(session)
            db.commit()
            db.refresh(session)

        # 2. Save User Message
        user_msg = models.Message(session_id=session.id, role="user", content=request.query)
        db.add(user_msg)
        db.commit()

        # 3. Generate AI Response using LangGraph
        result = research_app.invoke({
            "query": request.query,
            "steps": []
        })
        ai_content = result["final_answer"]
        steps = result["steps"]

        # 4. Save Assistant Message
        assistant_msg = models.Message(session_id=session.id, role="assistant", content=ai_content)
        db.add(assistant_msg)
        db.commit()
        
        return ChatResponse(
            response=ai_content,
            session_id=session.id,
            steps=steps
        )
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/sessions", response_model=List[ChatSessionResponse])
async def get_sessions(db: Session = Depends(get_db)):
    return db.query(models.ChatSession).order_by(models.ChatSession.created_at.desc()).all()

@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session_detail(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/sessions/{session_id}")
async def delete_session(session_id: int, db: Session = Depends(get_db)):
    session = db.query(models.ChatSession).filter(models.ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}
