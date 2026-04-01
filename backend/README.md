# Backend

FastAPI backend providing RAG-powered chat, document management, and admin authentication.

## Setup

```bash
# Install dependencies
uv sync

# Create .env (or copy from env.example)
cp env.example .env
# Edit .env and set GROQ_API_KEY

# Run
uv run uvicorn app.main:app --reload --port 8000
```

API docs available at http://localhost:8000/docs.

## Project Structure

```
backend/
├── app/
│   ├── main.py                 # FastAPI app, CORS, route registration
│   ├── api/
│   │   ├── chat.py             # Chat endpoints (send, history, sessions)
│   │   ├── documents.py        # Document upload, embed, CRUD, collections
│   │   ├── admin_auth.py       # Admin login, JWT token generation
│   │   └── admin_dashboard.py  # Protected admin endpoints
│   ├── core/
│   │   ├── config.py           # Settings from .env (Pydantic BaseSettings)
│   │   ├── database.py         # ChromaDB client, embedding model loader
│   │   └── admin.py            # JWT verification dependency
│   ├── models/
│   │   ├── chat.py             # ChatMessage, ChatResponse, Session models
│   │   └── document.py         # DocumentUpload, CollectionCreate models
│   ├── services/
│   │   ├── chat_service.py     # RAG: embed query → retrieve → generate
│   │   ├── document_service.py # Parse files, chunk text, store in ChromaDB
│   │   └── ingest.py           # Document ingestion pipeline
│   └── utils/
├── tests/
│   └── test_e2e.py             # 48 e2e tests (no mocks)
├── pyproject.toml              # Dependencies (managed by uv)
├── env.example                 # Template for .env
└── chroma_db/                  # ChromaDB persistent storage (gitignored)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `GROQ_API_KEY` | *required* | Groq API key for LLM |
| `GROQ_MODEL` | `meta-llama/llama-4-scout-17b-16e-instruct` | LLM model |
| `EMBEDDING_MODEL` | `all-MiniLM-L6-v2` | Sentence transformer model |
| `CHROMA_DB_PATH` | `./chroma_db` | ChromaDB storage path |
| `BACKEND_CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Allowed origins |
| `MAX_TOKENS` | `500` | Max response tokens |
| `TEMPERATURE` | `0.7` | LLM temperature |
| `TOP_P` | `1.0` | LLM top_p |
| `N_RESULTS` | `5` | Number of context chunks to retrieve |
| `ADMIN_USERNAME` | *required* | Admin login username |
| `ADMIN_PASSWORD` | *required* | Admin login password |
| `ADMIN_SECRET_KEY` | *required* | JWT signing key (min 32 chars) |

## API Endpoints

### Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/chat/` | Send message, get AI response with sources |
| POST | `/api/v1/chat/stream` | Send message (basic stream endpoint) |
| POST | `/api/v1/chat/session` | Create new session |
| GET | `/api/v1/chat/history/{session_id}` | Get conversation history |
| GET | `/api/v1/chat/sessions` | List all sessions |
| DELETE | `/api/v1/chat/session/{session_id}` | Delete a session |

### Documents

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/documents/upload` | Upload PDF/DOCX/TXT file |
| POST | `/api/v1/documents/embed` | Embed text content directly |
| POST | `/api/v1/documents/bulk-embed` | Embed multiple documents |
| GET | `/api/v1/documents/` | List documents in a collection |
| GET | `/api/v1/documents/{doc_id}` | Get document details + chunks |
| PUT | `/api/v1/documents/{doc_id}` | Update (replace) a document |
| DELETE | `/api/v1/documents/{doc_id}` | Delete a document |

### Collections

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/documents/collections/list` | List all collections |
| POST | `/api/v1/documents/collections/create` | Create a collection |
| DELETE | `/api/v1/documents/collections/{name}` | Delete a collection |

### Admin

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/admin/login` | None | Login, returns JWT |
| GET | `/api/v1/admin/status` | Bearer token | Check admin access |

## How RAG Works

1. **Ingest**: Documents are uploaded, parsed (PDF/DOCX/TXT), chunked (1000 chars, 200 overlap), embedded via `all-MiniLM-L6-v2`, and stored in ChromaDB.
2. **Query**: User message is embedded → top 8 similar chunks retrieved from ChromaDB (with deduplication) → chunks sent as context to Groq LLM.
3. **Response**: LLM generates an answer strictly from the provided context. If no relevant context exists, it says so.

## Tests

```bash
uv run pytest tests/ -v
```

48 tests covering:
- Health/root endpoints
- Chat sessions (create, list, delete, history)
- Document CRUD (embed, upload, update, delete, bulk)
- Collection management
- Admin auth (login, JWT validation, role checks)
- Edge cases (unicode, XSS, long text chunking, route conflicts, session isolation)
