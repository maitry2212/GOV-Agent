# 🏛️ Gov-Agent: AI-Powered Indian Government Services Assistant

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![LangGraph](https://img.shields.io/badge/LangGraph-2D3748?style=for-the-badge&logo=python&logoColor=white)](https://langchain-ai.github.io/langgraph/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Gov-Agent** is a sophisticated Multi-Agent Research System designed to simplify the complex landscape of Indian Government Services. Leveraging **LangGraph** for stateful orchestration and **Google Gemini** for reasoning, it provides citizens with accurate, step-by-step guidance for services like PAN cards, Passports, and Ration cards, sourced directly from official portals.

---

## 🚀 Key Features

- **🔍 Intelligent Query Decomposition**: Analyzes user intent to identify the specific service, task (new application, update, status), and governing entity.
- **🛡️ Official Source Enforcer**: Uses a dedicated agent to restrict research to official government domains (`*.gov.in`, `*.nic.in`), eliminating misinformation.
- **🕵️ Deep Research Workflow**: Implements a complex research pipeline using **Tavily Search** to find current procedures and documentation lists.
- **📑 Structured Data Parsing**: Summarizes dense government PDF/Web content into easy-to-read steps and document checklists.
- **✅ Cross-Verification Agent**: An automated verification layer ensures the extracted data matches standard administrative procedures.
- **💎 Premium UI/UX**: A modern, responsive dashboard built with React and Tailwind CSS featuring real-time research status tracking.

---

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Orchestration**: LangGraph (Stateful Multi-Agent workflows)
- **AI Models**: Google Gemini Pro (LLM)
- **Search Engine**: Tavily AI (Deep Web Research)
- **Validation**: Pydantic v2
- **Database**: SQLite with SQLAlchemy (for session/history tracking)

### Frontend
- **Framework**: React.js (Vite)
- **Styling**: Tailwind CSS
- **State Management**: React Hooks & Axios
- **Icons**: Lucide React / HeroIcons

---

## 🏗️ Multi-Agent Architecture

The system uses a directed acyclic graph (DAG) to handle the research process:

1.  **Query Understanding Agent**: Identifies the service type and task.
2.  **Source Selector Agent**: Matches the query to relevant official portals.
3.  **Research Agent**: Conducts deep-web crawling using optimized search queries.
4.  **Parsing Agent**: Extract specific data points (Steps, Fees, Documents).
5.  **Verification Agent**: Audits the result for accuracy.
6.  **Response Generation Agent**: Synthesizes the final authoritative guide.

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
source venv/bin/activate  # On Windows: .\venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in the `backend` directory:
```env
GOOGLE_API_KEY=your_gemini_api_key
TAVILY_API_KEY=your_tavily_api_key
PORT=8000
HOST=0.0.0.0
DEBUG=True
```

### 3. Frontend Setup
```bash
cd ../frontend
npm install
```

---

## 🚦 Running the Application

### Start Backend
```bash
cd backend
uvicorn main:app --reload
```

### Start Frontend
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`.


---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.


