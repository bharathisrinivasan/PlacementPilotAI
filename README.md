# PlacementPilot AI 🚀

**AI-Powered Career Concierge for College Placement Preparation**

PlacementPilot AI is a production-ready multi-agent system that analyzes student resumes, compares them against target roles, identifies skill gaps, optimizes for ATS systems, and generates personalized career preparation roadmaps.

Built with **Google ADK** multi-agent orchestration, **custom MCP Server**, **FastAPI** backend, and a premium **React + TypeScript** frontend.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Dashboard, Resume, ATS, Skills, Roadmap, Resources)   │
└─────────────────┬───────────────────────────────────────┘
                  │ REST API
┌─────────────────▼───────────────────────────────────────┐
│                FastAPI Backend                           │
│            ┌──────────────────┐                         │
│            │   Coordinator    │ (SequentialAgent)        │
│            │    Agent         │                         │
│            └──┬───┬───┬──────┘                         │
│               │   │   │                                 │
│  ┌────────────▼┐ ┌▼────────┐ ┌▼──────────┐            │
│  │  Profile    │ │ Career  │ │  Coach    │            │
│  │  Agent      │ │ Agent   │ │  Agent    │            │
│  └─────────────┘ └────┬────┘ └───────────┘            │
│                       │                                 │
│              ┌────────▼────────┐                       │
│              │   MCP Server    │                       │
│              │ (Career Data)   │                       │
│              └─────────────────┘                       │
└─────────────────────────────────────────────────────────┘
```

## ✨ Features

- **Resume Analysis** — AI-powered resume parsing with skill extraction
- **ATS Optimization** — Match your resume against job descriptions
- **Skill Gap Detection** — Identify must-have and good-to-have skill gaps
- **Placement Readiness Score** — Quantified readiness assessment
- **Career Roadmap** — Personalized week-by-week preparation plan
- **12+ Career Roles** — Comprehensive role database
- **MCP Server** — Structured career knowledge via Model Context Protocol
- **Multi-Agent System** — Google ADK orchestrated pipeline
- **Premium UI** — Dark futuristic design with glassmorphism
- **Security** — PII removal, input sanitization, secure file handling

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Vanilla CSS (Dark Glassmorphism) |
| Animations | Framer Motion |
| Charts | Recharts |
| State | Zustand |
| Backend | FastAPI, Python, Pydantic |
| AI Agents | Google ADK (LlmAgent, SequentialAgent) |
| AI Model | Google Gemini 2.0 Flash |
| Protocol | MCP (Model Context Protocol) |
| PDF | PyPDF2 |

## 📁 Project Structure

```
PlacementPilotAI/
├── backend/
│   ├── agents/
│   │   ├── profile_agent.py      # Resume parser agent
│   │   ├── career_agent.py       # Career analysis + MCP agent
│   │   ├── coach_agent.py        # Roadmap generation agent
│   │   └── coordinator.py        # SequentialAgent orchestrator
│   ├── mcp_server/
│   │   ├── career_data.py        # 12 role definitions
│   │   └── server.py             # FastMCP server
│   ├── api/
│   │   ├── models.py             # Pydantic schemas
│   │   └── routes.py             # REST endpoints
│   ├── utils/
│   │   ├── pdf_parser.py         # PDF extraction
│   │   └── security.py           # PII removal, validation
│   ├── tests/
│   ├── main.py                   # FastAPI entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/           # Reusable UI components
│   │   ├── pages/                # 7 application pages
│   │   ├── services/             # API client
│   │   ├── store/                # Zustand state
│   │   └── types/                # TypeScript definitions
│   ├── index.html
│   └── package.json
├── .env.example
├── .gitignore
├── Dockerfile
└── README.md
```

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Google Gemini API Key ([Get one here](https://aistudio.google.com/apikey))

### 1. Clone & Setup

```bash
git clone <repo-url>
cd PlacementPilotAI
```

### 2. Backend Setup

```bash
# Create virtual environment
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp ../.env.example ../.env
# Edit .env and add your GOOGLE_API_KEY
```

### 3. Frontend Setup

```bash
cd frontend
npm install
```

### 4. Run

```bash
# Terminal 1 — Backend
# IMPORTANT: run from PlacementPilotAI/ (project root), NOT from inside backend/
cd PlacementPilotAI        # make sure you're at the project root
.\backend\venv\Scripts\activate          # Windows: activate the venv
uvicorn backend.main:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Open **http://localhost:5173** in your browser.

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check & API status |
| `GET` | `/api/roles` | List all 12 career roles |
| `GET` | `/api/resources` | Aggregated learning resources |
| `POST` | `/api/analyze` | Full analysis (PDF upload) |
| `POST` | `/api/analyze-text` | Analysis from pasted text |
| `POST` | `/api/ats-analysis` | ATS optimization with JD |

## 🤖 Multi-Agent System

### Agent Pipeline

1. **Profile Intelligence Agent** — Parses resume, extracts skills/education/projects, removes PII
2. **Career Intelligence Agent** — Queries MCP Server, calculates ATS & readiness scores, identifies gaps
3. **Career Coach Agent** — Generates personalized roadmap, projects, interview prep

### MCP Server Tools

- `get_all_roles()` — List available roles
- `get_role_details(role_id)` — Full role data
- `get_role_requirements(role_id)` — Skills requirements
- `get_ats_keywords(role_id)` — ATS keyword list
- `get_learning_resources(role_id)` — Learning resources
- `get_interview_topics(role_id)` — Interview topics
- `compare_skills(role_id, skills)` — Skill comparison

## 🔒 Security

- API keys stored in `.env` only (never committed)
- PDF files processed in-memory (no disk writes)
- PII automatically detected and removed before AI processing
- Input validation on all endpoints
- File type and size validation
- Graceful error handling with user-friendly messages

## 🚢 Deployment

### Backend (Render)

```bash
docker build -t placementpilot-backend .
# Deploy to Render with Docker
```

### Frontend (Vercel)

```bash
cd frontend
npm run build
# Deploy dist/ folder to Vercel
```

## 📄 License

MIT License

---

Built with ❤️ for the Kaggle AI Agents Capstone
