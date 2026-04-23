from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List
from app.agents.research_agent import research_app
from app.schemas.chat import (
    ChatRequest, ChatResponse, ChatSessionResponse, 
    ChatSessionDetail, MessageResponse,
    SignUpRequest, SignInRequest, AuthResponse, UserResponse
)
from app.db.database import get_db
from app.db import models
from app.core.auth import (
    hash_password, verify_password, create_access_token, get_current_user
)

router = APIRouter()

# ───────────────────────────────────────────────
#  AUTH ENDPOINTS
# ───────────────────────────────────────────────

@router.post("/auth/signup", response_model=AuthResponse)
async def signup(request: SignUpRequest, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == request.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create user
    user = models.User(
        name=request.name,
        email=request.email,
        hashed_password=hash_password(request.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Generate token
    token = create_access_token({"user_id": user.id})
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )

@router.post("/auth/signin", response_model=AuthResponse)
async def signin(request: SignInRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == request.email).first()
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_access_token({"user_id": user.id})
    return AuthResponse(
        access_token=token,
        user=UserResponse.model_validate(user)
    )

@router.get("/auth/me", response_model=UserResponse)
async def get_me(current_user: models.User = Depends(get_current_user)):
    return current_user

# ───────────────────────────────────────────────
#  CHAT ENDPOINTS (Protected — user-scoped)
# ───────────────────────────────────────────────

@router.post("/chat", response_model=ChatResponse)
async def process_chat(
    request: ChatRequest,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        # 1. Handle Session
        if request.session_id:
            session = db.query(models.ChatSession).filter(
                models.ChatSession.id == request.session_id,
                models.ChatSession.user_id == current_user.id  # Only own sessions
            ).first()
            if not session:
                raise HTTPException(status_code=404, detail="Session not found")
        else:
            # Create new session tied to the current user
            title = request.query[:30] + "..." if len(request.query) > 30 else request.query
            session = models.ChatSession(title=title, user_id=current_user.id)
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
async def get_sessions(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Only return sessions belonging to the current user
    return db.query(models.ChatSession).filter(
        models.ChatSession.user_id == current_user.id
    ).order_by(models.ChatSession.created_at.desc()).all()

@router.get("/sessions/{session_id}", response_model=ChatSessionDetail)
async def get_session_detail(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id  # Only own sessions
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return session

@router.delete("/sessions/{session_id}")
async def delete_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    session = db.query(models.ChatSession).filter(
        models.ChatSession.id == session_id,
        models.ChatSession.user_id == current_user.id  # Only own sessions
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"message": "Session deleted"}

@router.get("/health")
async def health_check():
    return {"status": "healthy"}
