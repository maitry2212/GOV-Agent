# 🏛️ Gov-Agent: AI-Powered Indian Government Services Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-2D3748?style=for-the-badge&logo=python&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Gov-Agent** is a Multi-Agent Research System designed to simplify Indian Government Services. Leveraging **LangGraph** for stateful orchestration and **Google Gemini** for reasoning, it provides citizens with accurate, step-by-step guidance for services like PAN cards, Passports, and Ration cards, sourced directly from official portals.

---

## 🚀 Key Features

- **🔍 Intelligent Query Decomposition**: Analyzes user intent to identify the specific service, task (new application, update, status), and governing entity.
- **🛡️ Official Source Enforcer**: Uses a dedicated agent to restrict research to official government domains (`*.gov.in`, `*.nic.in`), eliminating misinformation.
- **🕵️ Deep Research Workflow**: Implements a research pipeline using **Tavily Search** to find current procedures and documentation lists.
- **📑 Structured Data Parsing**: Summarizes dense government PDF/Web content into easy-to-read steps and document checklists.
- **✅ Cross-Verification Agent**: An automated verification layer ensures the extracted data matches standard administrative procedures.
- **💎 Premium UI/UX**: A modern, responsive dashboard built with React and Tailwind CSS featuring real-time research status tracking.
- **🔐 JWT Authentication**: Secure user authentication with bcrypt password hashing and session management.
- **📝 Session History**: Persistent chat sessions with SQLite database storage for user conversations.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Orchestration**: LangGraph (Stateful Multi-Agent workflows)
- **AI Models**: Google Gemini Pro (via LangChain)
- **Search Engine**: Tavily AI (Deep Web Research)
- **Validation**: Pydantic v2
- **Database**: SQLite with SQLAlchemy (session/history tracking)
- **Authentication**: JWT (python-jose) with bcrypt password hashing

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **HTTP Client**: Axios with interceptors
- **UI Library**: Lucide React icons
- **Animations**: Framer Motion
- **Markdown Rendering**: react-markdown with remark-gfm

---

## 🏗️ Multi-Agent Architecture

The system uses a directed acyclic graph (DAG) via LangGraph to handle the research process:

| Node | Function |
|------|----------|
| **Query Understanding** | Extracts service, task, and entity from user query |
| **Source Selector** | Identifies official government portals (`*.gov.in`, `*.nic.in`) |
| **Query Generator** | Converts user query to optimized web search query |
| **Deep Research** | Executes Tavily search and collects documents |
| **Document Parser** | Extracts steps, required documents, and portal URLs |
| **Verification Agent** | Validates data confidence and official source status |
| **Response Generation** | Synthesizes final authoritative guide |

---

## 📁 Project Structure

```
GOV_Agent/
├── backend/
│   ├── app/
│   │   ├── agents/          # LangGraph workflow (research_agent.py)
│   │   ├── api/             # REST endpoints (endpoints.py)
│   │   ├── core/            # Config & auth utilities
│   │   ├── db/              # Database models & connection
│   │   ├── schemas/         # Pydantic schemas & agent state
│   │   └── services/        # LLM & search service wrappers
│   ├── main.py              # FastAPI application entry
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
├── frontend/
│   ├── src/
│   │   ├── components/      # AuthPage.jsx
│   │   ├── services/        # API client (api.js)
│   │   ├── App.jsx          # Main React component
│   │   └── main.jsx         # React entry point
│   ├── package.json
│   └── tailwind.config.js
├── notebooks/               # Jupyter notebooks (experiments)
├── web_service/             # Legacy web crawler
├── LICENSE
└── README.md
```

---

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- API Keys:
    - [Google AI Studio](https://aistudio.google.com/) (Gemini API)
    - [Tavily AI](https://tavily.com/)

---

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/GOV_Agent.git
cd GOV_Agent
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Unix/MacOS:
source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the `backend` directory:
```env
GOOGLE_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
PORT=8000
HOST=0.0.0.0
DEBUG=True
DATABASE_URL=sqlite:///sql_app.db  # Optional: defaults to SQLite
JWT_SECRET_KEY=your-secret-key-change-in-production
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

Create a `.env` file in the `frontend` directory (optional):
```env
VITE_API_URL=http://localhost:8000
```

---

## 🚦 Running the Application

### Start Backend
```bash
cd backend
uvicorn main:app --reload
```
Backend runs on `http://localhost:8000`

### Start Frontend
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173`

---

## 📡 API Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/signup` | User registration | No |
| POST | `/auth/signin` | User login | No |
| GET | `/auth/me` | Get current user | Yes |
| POST | `/chat` | Send research query | Yes |
| GET | `/sessions` | List user sessions | Yes |
| GET | `/sessions/{id}` | Get session messages | Yes |
| DELETE | `/sessions/{id}` | Delete session | Yes |
| GET | `/health` | Health check | No |

---

## 🧪 Example Usage

1. **Sign Up / Sign In**: Create an account or log in with existing credentials
2. **Start a Research Query**: Enter queries like:
   - "How to apply for a new PAN card?"
   - "Passport renewal process in Mumbai"
   - "Aadhaar address update documents required"
   - "Ration card eligibility criteria"
3. **View Agent Workflow**: Watch real-time execution of the multi-agent pipeline
4. **Access History**: Previous sessions are saved and accessible from the sidebar

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📧 Contact

For questions or support, please open an issue on the GitHub repository.
