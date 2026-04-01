# Frontend

React single-page application for the college chatbot. Includes a home page, chat interface, and a floating chat widget that can be toggled on any page.

## Setup

```bash
# Install dependencies
npm install

# Run dev server
npm start
```

Opens at http://localhost:3000. Expects the backend running at http://localhost:8000.

## Project Structure

```
frontend/src/
├── App.js                      # Router — all routes defined here
├── index.js                    # React entry point
├── index.css                   # Global styles (Plus Jakarta Sans font)
├── services/
│   └── api.js                  # API client (axios) — chatAPI + documentAPI
├── components/
│   ├── ChatWidget/             # Floating chat widget (appears on all pages)
│   │   ├── ChatWidget.jsx      #   Toggle open/close, sidebar, view switching
│   │   ├── ChatWidget.css      #   Widget styles
│   │   └── Sidebar.jsx         #   Sidebar navigation (New Chat, FAQ, About)
│   ├── HomeLayout.jsx          # Layout wrapper for the home page
│   ├── Layout.jsx              # Layout with sidebar for chat section
│   ├── Layout.css              # Navbar + layout styles
│   ├── Navbar.jsx              # Top navigation bar
│   └── Footer.jsx              # Page footer
├── pages/
│   ├── Home/
│   │   ├── Home.jsx            # Landing page
│   │   └── Home.css
│   ├── Chat/
│   │   ├── Chat.jsx            # Main chat interface (session + messages)
│   │   └── Chat.css
│   └── ChatViews/
│       ├── NewChat.jsx         # Wrapper that renders Chat
│       ├── About.jsx           # About page (inside widget)
│       ├── About.css
│       ├── Faq.jsx             # FAQ page (inside widget)
│       └── Faq.css
└── assets/                     # Images (college logo, backgrounds)
```

## Routes

| Path | Component | Description |
|------|-----------|-------------|
| `/` | Home (in HomeLayout) | Landing page with navbar + footer |
| `/chat` | Chat (in Layout) | Chat interface with sidebar |
| `/chat/new` | NewChat | New chat session |
| `/chat/about` | About | About page |
| `/chat/faq` | FAQ | Frequently asked questions |
| `*` | Redirect to `/` | Catch-all |

The `ChatWidget` component is rendered globally (outside routes) as a floating button on every page.

## API Client

`src/services/api.js` exports two API modules:

### chatAPI
- `sendMessage(message, sessionId, collectionName, config)` — send chat message
- `createSession(userId, metadata)` — create new session
- `getHistory(sessionId)` — get conversation history
- `deleteSession(sessionId)` — delete a session
- `listSessions()` — list all sessions

### documentAPI
- `uploadDocument(file, collectionName, metadata)` — upload file (PDF/DOCX/TXT)
- `embedText(content, title, metadata, collectionName)` — embed text directly
- `listDocuments(collectionName, limit)` — list documents
- `getDocument(docId, collectionName)` — get document details
- `deleteDocument(docId, collectionName)` — delete document
- `listCollections()` — list all collections
- `createCollection(name, metadata, overwrite)` — create collection
- `deleteCollection(name)` — delete collection

## Environment

The API base URL defaults to `http://localhost:8000/api/v1`. Override with:

```
REACT_APP_API_URL=https://your-api.com/api/v1
```

## Build

```bash
npm run build
```

Outputs optimized production build to `build/`.
