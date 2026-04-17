from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

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
