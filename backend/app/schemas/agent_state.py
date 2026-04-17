from typing import TypedDict, List, Dict, Optional
from pydantic import BaseModel, Field
from langchain_core.documents import Document

class AgentState(TypedDict):
    # User Input
    query: str
    
    # query extraction
    service: str
    task: str
    entity: str
    
    # Search & research
    sources: List[str]
    web_query: str
    documents: List[Document]
    
    # Data parsing
    parsed_data: Dict
    verified_data: Dict
    
    # Output
    final_answer: str
    steps: List[str] # To track execution flow

class QuerySchema(BaseModel):
    service: str = Field(description="The main government service requested (e.g., PAN Card, Aadhaar)")
    task: str = Field(description="The specific action needed (e.g., update address, apply new)")
    entity: str = Field(description="The organization or government body responsible")

class SourceSchema(BaseModel):
    sources: List[str] = Field(description="List of official Indian government portal URLs")

class WebQuerySchema(BaseModel):
    web_query: str = Field(description="Optimized web search query for government portals")

class ParsedSchema(BaseModel):
    steps: List[str] = Field(description="Sequential procedural steps")
    documents_required: List[str] = Field(description="Documents the user needs to provide")
    portal: str = Field(description="Direct URL to the service portal if found")

class VerifySchema(BaseModel):
    verified: bool = Field(description="Whether the info comes from official sources")
    confidence_score: float = Field(description="Value from 0 to 1")
    official_links: Optional[List[str]] = None
