# 🎯 Interview Questions & Answers — Indian Govt AI Research Agent (Gov-AIGuide)

---

## 📌 SECTION 1: PROJECT OVERVIEW

---

### Q1. What is this project? Explain it in simple terms.

**Answer:**
Gov-AIGuide is an **AI-powered chatbot** that helps Indian citizens find accurate, step-by-step information about government services — like how to apply for a PAN card, renew a passport, or update Aadhaar address.

Instead of manually searching through multiple `.gov.in` portals, the user just types their question in plain English. The AI agent automatically:
1. Understands the question
2. Identifies the right government service & portal
3. Searches the web for official information
4. Parses and verifies the information
5. Returns a clean, structured answer with official links

---

### Q2. What problem does this project solve?

**Answer:**
Indian citizens face several challenges when dealing with government services:

| Problem | Description |
|---|---|
| **Too many portals** | Different services like PAN, Aadhaar, Passport each have separate websites |
| **Outdated information** | Unofficial websites often show wrong or old procedures |
| **Complex language** | Government documents use legal/bureaucratic language that is hard to understand |
| **No guided flow** | Citizens don't know which documents to bring or what steps to follow |

**Gov-AIGuide solves all of this** by acting as an intelligent assistant that searches only official `.gov.in` / `.nic.in` portals and presents clear, verified, step-by-step answers.

---

### Q3. How does the project solve the problem?

**Answer:**
The project uses a **multi-step AI agent pipeline** built with **LangGraph**. The agent breaks down the user's query into multiple specialized tasks:

```
User Query ──► Understand ──► Select Sources ──► Generate Search Query
                                                         │
                                               Run Web Search (Tavily)
                                                         │
                                               Parse Documents (LLM)
                                                         │
                                               Verify Information
                                                         │
                                        ◄── Generate Final Response
```

Each step is a separate "node" in the graph. This modularity ensures the agent stays focused, accurate, and easy to debug.

---

---

## 📌 SECTION 2: ARCHITECTURE & TECHNICAL EXPLANATION

---

### Q4. Explain the overall system architecture.

**Answer:**
The project follows a **Full-Stack 3-Layer Architecture**:

```
┌─────────────────────────────────────────────────┐
│                  FRONTEND (React + Vite)         │
│  - Chat UI with sidebar session management       │
│  - Displays agent workflow steps in real-time    │
│  - Sends API requests using Axios                │
└─────────────────────────┬───────────────────────┘
                          │ HTTP REST API
┌─────────────────────────▼───────────────────────┐
│                 BACKEND (FastAPI)                │
│  - /api/v1/chat  → triggers LangGraph agent      │
│  - /api/v1/sessions → CRUD for chat history      │
│  - Persists messages to SQLite via SQLAlchemy    │
└─────────────────────────┬───────────────────────┘
                          │ Invokes
┌─────────────────────────▼───────────────────────┐
│              AI AGENT (LangGraph)                │
│  7-node pipeline:                                │
│  understand → source → query_gen → research      │
│  → parse → verify → generate                    │
│  Uses Groq LLaMA 3.3 70B + Tavily Search        │
└─────────────────────────────────────────────────┘
```

**Tech Stack:**

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | FastAPI, Uvicorn, Pydantic |
| AI Agent | LangGraph, LangChain, Groq (LLaMA 3.3 70B) |
| Search | Tavily Search API |
| Database | SQLite + SQLAlchemy ORM |
| State Mgmt | TypedDict (AgentState) |

---

### Q5. What is LangGraph and why was it used here instead of a simple LLM call?

**Answer:**
**LangGraph** is a library built on top of LangChain that allows you to define AI agent workflows as **directed graphs** (nodes + edges).

**Why LangGraph instead of a plain LLM call?**

| Simple LLM Call | LangGraph Agent |
|---|---|
| One-shot response, no control flow | Multiple specialized steps |
| Can hallucinate easily | Each step is validated |
| Hard to debug | Steps are tracked and logged |
| No structure | Structured outputs via Pydantic |

In this project, a single `research_app.invoke()` call triggers a **7-step pipeline** automatically, moving data through nodes like an assembly line.

```python
# LangGraph compiles the full pipeline into one callable:
research_app = create_workflow()  # returns a CompiledStateGraph
result = research_app.invoke({"query": user_question, "steps": []})
```

---

### Q6. Explain the `AgentState` TypedDict. Why is it used?

**Answer:**
`AgentState` is the **shared memory/context** that flows through every node in the LangGraph pipeline.

```python
class AgentState(TypedDict):
    query: str           # Original user question
    service: str         # e.g., "PAN Card"
    task: str            # e.g., "apply new"
    entity: str          # e.g., "Income Tax Department"
    sources: List[str]   # Official portal URLs
    web_query: str       # Optimized search query
    documents: List[Document]  # Raw web search results
    parsed_data: Dict    # Extracted steps & documents
    verified_data: Dict  # Confidence score & links
    final_answer: str    # Final formatted output
    steps: List[str]     # Execution log
```

**Why TypedDict?**
- LangGraph requires the state to be a `TypedDict` so it can track what keys each node reads and writes
- It acts like a **shared blackboard** — each node reads what it needs and writes its output back
- The `steps` field acts as an **execution log** visible in the frontend

---

### Q7. Walk me through all 7 agent nodes.

**Answer:**

#### Node 1: `query_understanding`
```python
def query_understanding(state: AgentState):
    structured_llm = llm.with_structured_output(QuerySchema)
    result = structured_llm.invoke(f"Extract government service info from: {state['query']}")
    return {"service": result.service, "task": result.task, "entity": result.entity}
```
- Uses `with_structured_output(QuerySchema)` to force the LLM to return a specific JSON structure
- **QuerySchema** has 3 fields: `service`, `task`, `entity`

---

#### Node 2: `source_selector`
```python
def source_selector(state: AgentState):
    structured_llm = llm.with_structured_output(SourceSchema)
    result = structured_llm.invoke(f"Find official Indian govt portals for: {state['service']} {state['task']}")
    return {"sources": result.sources}
```
- Identifies which `.gov.in` or `.nic.in` portals are relevant
- Constrains the LLM to only output official government URLs

---

#### Node 3: `generate_web_query`
```python
def generate_web_query(state: AgentState):
    structured_llm = llm.with_structured_output(WebQuerySchema)
    result = structured_llm.invoke(f"Convert question into web search query: {state['query']}")
    return {"web_query": result.web_query}
```
- Converts casual user language into an optimized Google-style search query
- Outputs a single `web_query` string

---

#### Node 4: `run_deep_research`
```python
def run_deep_research(state: AgentState):
    results = tavily.invoke({"query": state["web_query"]})  # Real web search
    web_docs = [Document(page_content=r["content"], metadata={"url": r["url"]}) for r in results]
    return {"documents": web_docs}
```
- Uses **Tavily** (a search API designed for LLMs) to do actual web search
- Converts raw JSON results into `langchain_core.documents.Document` objects

---

#### Node 5: `document_parser`
```python
def document_parser(state: AgentState):
    context = "\n".join([doc.page_content for doc in state["documents"][:3]])
    structured_llm = llm.with_structured_output(ParsedSchema)
    result = structured_llm.invoke(f"Extract procedure steps and required documents from:\n{context}")
    return {"parsed_data": result.model_dump()}
```
- Takes raw web content and extracts structured data:
  - `steps`: List of procedure steps
  - `documents_required`: List of documents the citizen needs to bring
  - `portal`: Direct official URL

---

#### Node 6: `verification_agent`
```python
def verification_agent(state: AgentState):
    structured_llm = llm.with_structured_output(VerifySchema)
    result = structured_llm.invoke(f"Is this data from official Indian govt sources?\n{state['parsed_data']}")
    return {"verified_data": result.model_dump()}
```
- Verifies the parsed data using `VerifySchema`:
  - `verified: bool` — is it from official sources?
  - `confidence_score: float` — 0.0 to 1.0
  - `official_links: List[str]` — list of verified URLs

---

#### Node 7: `response_generation`
```python
def response_generation(state: AgentState):
    response = llm.invoke(f"Act as a helpful Indian govt service assistant. Answer: {state['query']} using {state['parsed_data']}")
    return {"final_answer": response.content}
```
- Generates the final human-readable answer using all collected information
- Explicitly instructs the LLM to cite only official websites

---

### Q8. How is the LangGraph workflow compiled and connected?

**Answer:**
```python
def create_workflow():
    builder = StateGraph(AgentState)   # 1. Create graph with state schema

    # 2. Register all nodes
    builder.add_node("understand", query_understanding)
    builder.add_node("source", source_selector)
    builder.add_node("query_gen", generate_web_query)
    builder.add_node("research", run_deep_research)
    builder.add_node("parse", document_parser)
    builder.add_node("verify", verification_agent)
    builder.add_node("generate", response_generation)

    # 3. Connect nodes in sequence
    builder.add_edge(START, "understand")
    builder.add_edge("understand", "source")
    builder.add_edge("source", "query_gen")
    builder.add_edge("query_gen", "research")
    builder.add_edge("research", "parse")
    builder.add_edge("parse", "verify")
    builder.add_edge("verify", "generate")
    builder.add_edge("generate", END)

    return builder.compile()   # 4. Compile into runnable graph
```

- `StateGraph(AgentState)` — tells LangGraph what the state looks like
- `add_node()` — registers a Python function as a graph node
- `add_edge()` — connects nodes in a linear sequence
- `compile()` — validates the graph and returns an executable object

---

### Q9. Explain `with_structured_output()`. What is its advantage?

**Answer:**
`with_structured_output(SomePydanticModel)` is a LangChain method that forces the LLM to respond in a **structured JSON format** matching a Pydantic schema.

```python
class QuerySchema(BaseModel):
    service: str = Field(description="The main government service requested")
    task: str = Field(description="The specific action needed")
    entity: str = Field(description="The responsible government body")

structured_llm = llm.with_structured_output(QuerySchema)
result = structured_llm.invoke("How do I apply for a PAN card?")
# result.service = "PAN Card"
# result.task = "apply new"
# result.entity = "Income Tax Department"
```

**Advantages:**
1. **No parsing** — The output is already a Python object, not raw text
2. **Type safety** — Pydantic validates the types automatically
3. **No hallucination of format** — LLM can't return arbitrary text
4. **Works with `.model_dump()`** — Easily converts to dict for storage

---

### Q10. Explain the database design and persistence layer.

**Answer:**
The project uses **SQLite** + **SQLAlchemy ORM** for persistent chat history.

**Models:**
```python
class ChatSession(Base):
    __tablename__ = "chat_sessions"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, default="New Chat")   # First 30 chars of query
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")

class Message(Base):
    __tablename__ = "messages"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("chat_sessions.id"))
    role = Column(String)   # "user" or "assistant"
    content = Column(Text)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    session = relationship("ChatSession", back_populates="messages")
```

**Flow:**
1. New query → create `ChatSession` → save `Message(role="user")`
2. Agent runs → save `Message(role="assistant")`
3. Return `session_id` to frontend so future messages append to same session

**Dependency Injection in FastAPI:**
```python
def get_db():
    db = SessionLocal()
    try:
        yield db      # Provide the session to the endpoint
    finally:
        db.close()    # Always close after request
```

---

### Q11. How does the FastAPI backend handle requests?

**Answer:**
The key endpoint is `POST /api/v1/chat`:

```python
@router.post("/chat", response_model=ChatResponse)
async def process_chat(request: ChatRequest, db: Session = Depends(get_db)):
    # Step 1: Handle or create session
    if request.session_id:
        session = db.query(models.ChatSession).filter(...).first()
    else:
        session = models.ChatSession(title=request.query[:30] + "...")
        db.add(session); db.commit()

    # Step 2: Save user message
    db.add(models.Message(session_id=session.id, role="user", content=request.query))

    # Step 3: Run AI agent pipeline
    result = research_app.invoke({"query": request.query, "steps": []})

    # Step 4: Save assistant message
    db.add(models.Message(session_id=session.id, role="assistant", content=result["final_answer"]))

    # Step 5: Return response
    return ChatResponse(response=result["final_answer"], session_id=session.id, steps=result["steps"])
```

---

### Q12. Explain the Pydantic Schemas used in this project.

**Answer:**

| Schema | Purpose | Key Fields |
|---|---|---|
| `QuerySchema` | Extract query intent | `service`, `task`, `entity` |
| `SourceSchema` | Identify official portals | `sources: List[str]` |
| `WebQuerySchema` | Generate search query | `web_query: str` |
| `ParsedSchema` | Extract structured procedure | `steps`, `documents_required`, `portal` |
| `VerifySchema` | Validate source authenticity | `verified: bool`, `confidence_score: float` |
| `ChatRequest` | API input | `query: str`, `session_id: Optional[int]` |
| `ChatResponse` | API output | `response`, `session_id`, `steps` |

---

### Q13. What is Tavily and why is it used instead of Google Search?

**Answer:**
**Tavily** is a search API purpose-built for AI/LLM applications. Unlike Google Custom Search:

| Google Search | Tavily |
|---|---|
| Returns HTML pages | Returns clean text content |
| Requires heavy parsing | LLM-ready structured format |
| Rate limited for free tier | Designed for agents |
| No AI-specific features | Supports `include_domains` filtering |

```python
def get_search_tool():
    return TavilySearchResults(
        max_results=1,          # Only fetch top 1 result to keep costs low
        api_key=settings.TAVILY_API_KEY
    )
```

The result is a list of dicts: `[{"url": "...", "content": "..."}]`, which is then wrapped in `Document` objects.

---

### Q14. How is the LLM configured and why Groq with LLaMA 3.3 70B?

**Answer:**
```python
def get_llm():
    return ChatGroq(
        model="llama-3.3-70b-versatile",
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.7
    )
```

**Why Groq + LLaMA 3.3 70B?**

| Reason | Detail |
|---|---|
| **Speed** | Groq uses custom LPU (Language Processing Unit) hardware — extremely fast inference |
| **Free tier** | Groq provides free API access for development |
| **LLaMA 3.3 70B** | Meta's open-source model, excellent at instruction following and structured output |
| **temperature=0.7** | Balances creativity and accuracy |

---

---

## 📌 SECTION 3: FRONTEND QUESTIONS

---

### Q15. Explain the frontend architecture.

**Answer:**
The frontend is a **React 18 + Vite** single-page application using Tailwind CSS.

**Key React Features Used:**
```jsx
// State management
const [messages, setMessages] = useState([]);
const [sessions, setSessions] = useState([]);
const [currentSessionId, setCurrentSessionId] = useState(null);
const [isLoading, setIsLoading] = useState(false);
const [currentSteps, setCurrentSteps] = useState([]);

// Side effects
useEffect(() => { fetchSessions(); }, []);  // Load sessions on mount
useEffect(() => { scrollToBottom(); }, [messages, currentSteps]);  // Auto-scroll

// UI ref for scroll
const messagesEndRef = useRef(null);
```

**Libraries Used:**
| Library | Purpose |
|---|---|
| `framer-motion` | Smooth animations for messages appearing |
| `lucide-react` | Icon set (Send, Bot, ShieldCheck, etc.) |
| `react-markdown` | Renders AI markdown responses as HTML |
| `remark-gfm` | GitHub Flavored Markdown (tables, lists) |
| `axios` | HTTP client for API calls |

---

### Q16. How does session management work in the frontend?

**Answer:**

```jsx
// Load session from sidebar click
const loadSession = async (sessionId) => {
    const data = await getSessionMessages(sessionId);
    setCurrentSessionId(data.id);
    const mappedMessages = data.messages.map(m => ({
        type: m.role === 'assistant' ? 'ai' : 'user',
        content: m.content,
        id: m.id
    }));
    setMessages(mappedMessages);
};

// After new chat, update sessions list
if (!currentSessionId && result.session_id) {
    setCurrentSessionId(result.session_id);
    fetchSessions();  // Refresh sidebar
}
```

**Flow:**
1. On app load → `GET /sessions` → populate sidebar
2. User clicks session → `GET /sessions/{id}` → load messages
3. New message sent → `POST /chat` → response includes `session_id` → update sidebar
4. Delete button → `DELETE /sessions/{id}` → refresh sidebar

---

---

## 📌 SECTION 4: ADVANCED / TRICKY QUESTIONS

---

### Q17. What are the limitations of this project?

**Answer:**
| Limitation | Description |
|---|---|
| **No streaming** | The agent runs fully and then returns; no token-by-token streaming |
| **Single search result** | `max_results=1` in Tavily limits information breadth |
| **No caching** | Same query runs the full agent pipeline every time |
| **No user authentication** | All users share the same "Officer Account" identity |
| **SQLite only** | Not suitable for production-scale multi-user deployments |
| **No conditional branching** | The graph is purely sequential; no retry or fallback paths |

---

### Q18. How would you add conditional branching to the LangGraph pipeline?

**Answer:**
Currently the pipeline is linear. To add conditional routing:

```python
def should_retry(state: AgentState) -> str:
    if state["verified_data"].get("confidence_score", 0) < 0.5:
        return "research"   # Go back and re-search
    return "generate"       # Proceed to response

# In create_workflow():
builder.add_conditional_edges(
    "verify",
    should_retry,
    {"research": "research", "generate": "generate"}
)
```

This would allow the agent to retry the search if the confidence score from the verification node is too low.

---

### Q19. What is `cascade="all, delete-orphan"` in SQLAlchemy?

**Answer:**
```python
messages = relationship("Message", back_populates="session", cascade="all, delete-orphan")
```

This means:
- When a `ChatSession` is deleted → all its `Message` rows are **automatically deleted** too
- Without this, you'd get orphaned message rows with dangling foreign keys
- `delete-orphan` also removes a message if it's *removed from the relationship collection* (not just when the parent is deleted)

---

### Q20. Why use `async def` in FastAPI endpoints but `llm.invoke()` (synchronous)?

**Answer:**
This is a real architectural concern. `research_app.invoke()` is a **blocking synchronous call** but the FastAPI endpoint is `async def`.

In production, this should be:
```python
import asyncio

# Option 1: Run in thread pool
result = await asyncio.get_event_loop().run_in_executor(
    None, research_app.invoke, {"query": request.query, "steps": []}
)

# Option 2: Use LangGraph's async invoke (if supported)
result = await research_app.ainvoke({"query": request.query, "steps": []})
```

Currently the synchronous call inside `async def` blocks the event loop during agent execution, which is acceptable for single-user development but will cause performance issues under load.

---

### Q21. What is `Base.metadata.create_all(bind=engine)` in `main.py`?

**Answer:**
```python
Base.metadata.create_all(bind=engine)
```

This single line:
1. Reads all SQLAlchemy model classes that inherit from `Base`
2. Generates the corresponding SQL `CREATE TABLE` statements
3. Executes them against the database **only if the tables don't already exist**

It's a simple alternative to database migration tools like Alembic. For production, you would use Alembic for versioned schema migrations.

---

### Q22. How is CORS configured and why?

**Answer:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # Allow ALL origins (development only!)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**CORS (Cross-Origin Resource Sharing)** is needed because:
- The React frontend runs on `http://localhost:5173` (Vite dev server)
- The FastAPI backend runs on `http://localhost:8000`
- Browsers block cross-origin requests by default

`allow_origins=["*"]` is **only safe in development**. In production, restrict it:
```python
allow_origins=["https://yourdomain.com"]
```

---

### Q23. How would you scale this project for production?

**Answer:**
| Area | Current | Production Upgrade |
|---|---|---|
| **Database** | SQLite | PostgreSQL with connection pooling |
| **LLM** | Groq (free) | Azure OpenAI or Groq with paid plan |
| **Server** | Uvicorn single process | Gunicorn + multiple Uvicorn workers |
| **Auth** | None | JWT tokens with FastAPI OAuth2 |
| **Caching** | None | Redis for repeated query caching |
| **CORS** | `["*"]` | Specific domain allowlist |
| **Search** | `max_results=1` | `max_results=5` with re-ranking |
| **Frontend** | Vite dev server | Nginx static serving with CDN |

---

### Q24. What is `model_dump()` and when is it used?

**Answer:**
`model_dump()` is a Pydantic v2 method (previously `dict()` in v1) that converts a Pydantic model instance into a plain Python dictionary.

```python
class ParsedSchema(BaseModel):
    steps: List[str]
    documents_required: List[str]
    portal: str

result = structured_llm.invoke(context)  # returns ParsedSchema instance
# result.steps = ["Step 1...", "Step 2..."]

return {"parsed_data": result.model_dump()}
# {"parsed_data": {"steps": [...], "documents_required": [...], "portal": "..."}}
```

It's used here because `AgentState` stores `parsed_data` as a `Dict`, not a Pydantic model, so the conversion is necessary.

---

### Q25. Walk through a complete end-to-end flow for the query "How to apply for a PAN card?"

**Answer:**

```
1. User types: "How to apply for a PAN card?"
   Frontend → POST /api/v1/chat {"query": "...", "session_id": null}

2. FastAPI:
   - Creates ChatSession (title="How to apply for a PAN...")
   - Saves Message(role="user", content="How to apply for a PAN card?")
   - Calls research_app.invoke({"query": "How to apply for a PAN card?", "steps": []})

3. Agent Node 1 (query_understanding):
   → service="PAN Card", task="apply new", entity="Income Tax Department of India"
   → steps=["Query Understanding Completed"]

4. Agent Node 2 (source_selector):
   → sources=["https://tin.tin.nsdl.com", "https://www.onlineservices.nsdl.com"]
   → steps=[..., "Official Portals Identified"]

5. Agent Node 3 (generate_web_query):
   → web_query="PAN card new application process site:nsdl.com OR site:gov.in"
   → steps=[..., "Web Search query generated"]

6. Agent Node 4 (run_deep_research):
   → Tavily searches the web and returns actual content from NSDL/UTIITSL portals
   → documents=[Document(page_content="...", metadata={"url": "..."})]
   → steps=[..., "Deep research on govt portals completed"]

7. Agent Node 5 (document_parser):
   → parsed_data = {
       "steps": ["Visit onlineservices.nsdl.com", "Fill Form 49A", "Submit with photo ID", "Pay fee Rs.107"],
       "documents_required": ["Aadhaar", "Birth Certificate", "Photo"],
       "portal": "https://www.onlineservices.nsdl.com/paam/endUserRegisterContact.html"
     }
   → steps=[..., "Parsing research data..."]

8. Agent Node 6 (verification_agent):
   → verified_data = {"verified": True, "confidence_score": 0.90, "official_links": ["..."]}
   → steps=[..., "Verification confirmed"]

9. Agent Node 7 (response_generation):
   → final_answer = "To apply for a new PAN card, visit the official NSDL portal at..."
   → steps=[..., "Response Generated"]

10. FastAPI:
    - Saves Message(role="assistant", content=final_answer)
    - Returns ChatResponse{response=..., session_id=1, steps=[...]}

11. Frontend:
    - Displays AI message with Markdown rendering
    - Shows 7 steps in the right sidebar
    - Adds session to sidebar with title "How to apply for a PAN..."
```

---

## 📌 SECTION 5: QUICK FIRE ROUND

---

| Question | Answer |
|---|---|
| What port does the backend run on? | 8000 (configurable via `.env`) |
| What port does the frontend run on? | 5173 (Vite default) |
| What database is used? | SQLite (`sql_app.db`) |
| What LLM is used? | LLaMA 3.3 70B via Groq API |
| What search API is used? | Tavily (`TavilySearchResults`) |
| What is the state object type? | `TypedDict` (AgentState) |
| How many nodes are in the graph? | 7 nodes |
| What is `START` and `END` in LangGraph? | Special sentinel nodes for entry/exit |
| How many max search results does Tavily return? | 1 (configured in `get_search_tool`) |
| What frontend framework is used? | React 18 with Vite |
| What CSS framework is used? | Tailwind CSS with custom brand colors |
| What handles markdown rendering? | `react-markdown` + `remark-gfm` |
| What handles animations? | `framer-motion` |
| What ORM is used? | SQLAlchemy |
| What is `cascade="all, delete-orphan"`? | Auto-deletes child messages when session is deleted |
| What is `with_structured_output()`? | Forces LLM to return a Pydantic-typed JSON response |
| What HTTP method creates a new chat? | POST `/api/v1/chat` |
| What HTTP method deletes a session? | DELETE `/api/v1/sessions/{session_id}` |
| What is `Depends(get_db)` in FastAPI? | Dependency injection for database session |
| What is `temperature=0.7` in the LLM? | Controls randomness (0=deterministic, 1=creative) |
