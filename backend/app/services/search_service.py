import os
from langchain_community.tools.tavily_search import TavilySearchResults
from app.core.config import settings

def get_search_tool():
    return TavilySearchResults(
        max_results=1,
        api_key=settings.TAVILY_API_KEY
    )
