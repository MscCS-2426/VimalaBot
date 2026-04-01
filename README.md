# Chatbot PoC

A RAG-powered college chatbot with a FastAPI backend, React frontend, embeddable widget, and web scraper.

Students can ask questions about admissions, courses, fees, and campus services. The chatbot retrieves relevant context from a ChromaDB vector store and generates answers using Groq (LLaMA).

## Architecture

```
                  ┌────────────┐
                  │   Scraper  │   Crawls college website
                  │  (Python)  │   Exports to DOCX
                  └─────┬──────┘
                        │ upload
┌────────────┐    ┌─────▼──────┐    ┌────────────┐
│  Frontend   │───▶│  Backend   │───▶│  ChromaDB  │
│  (React)    │◀───│  (FastAPI) │◀───│  (Vectors) │
└────────────┘    └─────┬──────┘    └────────────┘
                        │
┌────────────┐          │
│   Embed    │──────────┘
│ (widget.js)│   Any website can embed the chatbot
└────────────┘
```

## Quick Start

```bash
# 1. Setup (installs all dependencies)
./setup.sh

# 2. Configure
#    Edit backend/.env and set your GROQ_API_KEY

# 3. Run
./start.sh

# 4. Open
#    Frontend:  http://localhost:3000
#    Backend:   http://localhost:8000
#    API Docs:  http://localhost:8000/docs

# 5. Stop
./stop.sh
```

## Project Structure

```
chatbot-poc/
├── backend/        FastAPI backend (RAG, chat, document management, admin auth)
├── frontend/       React frontend (chat UI, home page, widget)
├── embed/          Standalone embeddable chat widget (vanilla JS)
├── scraper/        Web scraper for ingesting college website content
├── docs/           API collection (Postman)
├── setup.sh        Install all dependencies + create .env
├── start.sh        Start backend + frontend
└── stop.sh         Stop all services
```

See individual READMEs for details:
- [Backend](backend/README.md)
- [Frontend](frontend/README.md)
- [Embed Widget](embed/widget.js) (usage docs in the file header)

## Prerequisites

- **Python** >= 3.12
- **Node.js** >= 18
- **uv** (Python package manager) — `curl -LsSf https://astral.sh/uv/install.sh | sh`
- **Groq API key** — get one at https://console.groq.com

## API Overview

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/chat/` | POST | Send a message, get AI response |
| `/api/v1/chat/session` | POST | Create a new chat session |
| `/api/v1/chat/history/{id}` | GET | Get session chat history |
| `/api/v1/chat/sessions` | GET | List all sessions |
| `/api/v1/documents/upload` | POST | Upload PDF/DOCX/TXT |
| `/api/v1/documents/embed` | POST | Embed text directly |
| `/api/v1/documents/collections/list` | GET | List all collections |
| `/api/v1/admin/login` | POST | Admin login (returns JWT) |
| `/api/v1/admin/status` | GET | Admin status (requires token) |

Full interactive docs at http://localhost:8000/docs when running.

## Embedding the Widget

Drop this into any HTML page:

```html
<script
  src="https://your-domain.com/widget.js"
  data-api="http://localhost:8000"
  data-title="Vimala Bot"
  data-color="#8B0000"
></script>
```

See `embed/demo.html` for a working example.

## Running Tests

```bash
cd backend
uv run pytest tests/ -v
```

48 end-to-end tests covering chat, documents, collections, admin auth, and edge cases. No mocks — tests run against real FastAPI + ChromaDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Groq (LLaMA 4 Scout) |
| Embeddings | Sentence Transformers (all-MiniLM-L6-v2) |
| Vector DB | ChromaDB |
| Backend | FastAPI, Pydantic, Uvicorn |
| Frontend | React 19, React Router, Axios |
| Auth | JWT (PyJWT) |
| Scraper | crawl4ai, BeautifulSoup4 |
| Package Mgmt | uv (Python), npm (JS) |
