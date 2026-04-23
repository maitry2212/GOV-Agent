from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

# ───── Auth Schemas ─────
class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str

class SignInRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str

    class Config:
        from_attributes = True

# ───── Chat Schemas ─────
class MessageBase(BaseModel):
    role: str
    content: str

class MessageCreate(MessageBase):
    session_id: int

class MessageResponse(MessageBase):
    id: int
    session_id: int
    timestamp: datetime

    class Config:
        from_attributes = True

class ChatSessionBase(BaseModel):
    title: str = "New Chat"

class ChatSessionResponse(ChatSessionBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class ChatSessionDetail(ChatSessionResponse):
    messages: List[MessageResponse] = []

class ChatRequest(BaseModel):
    query: str
    session_id: Optional[int] = None

class ChatResponse(BaseModel):
    response: str
    session_id: int
    steps: List[str]
