from langgraph.graph import StateGraph, END, START
from langchain_core.documents import Document
from app.schemas.agent_state import (
    AgentState, 
    QuerySchema, 
    SourceSchema, 
    WebQuerySchema, 
    ParsedSchema, 
    VerifySchema
)
from app.services.llm_service import get_llm
from app.services.search_service import get_search_tool

llm = get_llm()
tavily = get_search_tool()

def query_understanding(state: AgentState):
    structured_llm = llm.with_structured_output(QuerySchema)
    
    result = structured_llm.invoke(
        f"""
        Extract government service information from the user query.
        Query: {state["query"]}
        
        Identify:
        - service (e.g. PAN card, Passport, Ration card)
        - task (e.g. apply new, update, check status)
        - entity (state or central govt body)
        """
    )
    
    return {
        "service": result.service,
        "task": result.task,
        "entity": result.entity,
        "steps": state.get("steps", []) + ["Query Understanding Completed"]
    }

def source_selector(state: AgentState):
    structured_llm = llm.with_structured_output(SourceSchema)
    
    result = structured_llm.invoke(
        f"""
        Identify official Indian government websites for this service.
        Service: {state["service"]} {state["task"]}
        
        Only return official portals like:
        *.gov.in
        *.nic.in
        """
    )
    
    return {
        "sources": result.sources,
        "steps": state.get("steps", []) + ["Official Portals Identified"]
    }

def generate_web_query(state: AgentState):
    structured_llm = llm.with_structured_output(WebQuerySchema)
    
    result = structured_llm.invoke(
        f"""
        Convert the user question into an efficient web search query
        to find current official Indian government process documents.
        Question: {state["query"]}
        Context: {state["service"]} - {state["task"]}
        """
    )
    
    return {
        "web_query": result.web_query,
        "steps": state.get("steps", []) + ["Web Search query generated"]
    }

def run_deep_research(state: AgentState):
    search_query = state["web_query"]
    results = tavily.invoke({"query": search_query})
    
    web_docs = []
    for r in results or []:
        url = r.get("url", "")
        content = r.get("content", "")
        web_docs.append(Document(page_content=content, metadata={"url": url}))
    
    return {
        "documents": web_docs,
        "steps": state.get("steps", []) + ["Deep research on govt portals completed"]
    }

def document_parser(state: AgentState):
    structured_llm = llm.with_structured_output(ParsedSchema)
    
    context = "\n".join([doc.page_content for doc in state["documents"][:3]])
    
    result = structured_llm.invoke(
        f"""
        Below is the research content from official portals.
        Extract the step-by-step procedure and the mandatory documents required for the user's task.
        
        Research Content:
        {context}
        """
    )
    
    return {
        "parsed_data": result.model_dump(),
        "steps": state.get("steps", []) + ["Parsing research data..."]
    }

def verification_agent(state: AgentState):
    structured_llm = llm.with_structured_output(VerifySchema)
    
    result = structured_llm.invoke(
        f"""
        Verify if the extracted information matches typical Indian government procedures.
        
        Data:
        {state["parsed_data"]}
        """
    )
    
    return {
        "verified_data": result.model_dump(),
        "steps": state.get("steps", []) + ["Verification confirmed"]
    }

def response_generation(state: AgentState):
    # final response context
    data = state["parsed_data"]
    
    response = llm.invoke(
        f"""
        Act as a helpful Indian government service assistant.
        Generate a clear, authoritative response for the user about {state['query']}.
        
        Official Portal: {data.get("portal", "National Govt Services Portal")}
        Steps: {data.get("steps")}
        Required Documents: {data.get("documents_required")}
        
        Important: Cite official websites only.
        """
    )
    
    return {
        "final_answer": response.content,
        "steps": state.get("steps", []) + ["Response Generated"]
    }

def create_workflow():
    builder = StateGraph(AgentState)
    
    # Nodes
    builder.add_node("understand", query_understanding)
    builder.add_node("source", source_selector)
    builder.add_node("query_gen", generate_web_query)
    builder.add_node("research", run_deep_research)
    builder.add_node("parse", document_parser)
    builder.add_node("verify", verification_agent)
    builder.add_node("generate", response_generation)
    
    # Edges
    builder.add_edge(START, "understand")
    builder.add_edge("understand", "source")
    builder.add_edge("source", "query_gen")
    builder.add_edge("query_gen", "research")
    builder.add_edge("research", "parse")
    builder.add_edge("parse", "verify")
    builder.add_edge("verify", "generate")
    builder.add_edge("generate", END)
    
    return builder.compile()

research_app = create_workflow()
