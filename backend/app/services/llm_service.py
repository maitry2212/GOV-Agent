import os
from langchain_google_genai import ChatGoogleGenerativeAI
from app.core.config import settings
from langchain_groq import ChatGroq

def get_llm():
    return ChatGroq(
    model="llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.7
)
    

