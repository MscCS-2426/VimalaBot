import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse

from .core.config import settings
from .api import chat, documents, admin_auth, admin_dashboard


#  CREATE APP
app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="A chatbot API with document management and vector search capabilities"
)


# CORS MIDDLEWARE
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ROUTES
@app.get("/")
def root():
    return {
        "message": "Welcome to the Chatbot API!",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy", "message": "API is running"}


#  ROUTERS
app.include_router(chat.router, prefix=settings.API_V1_STR)
app.include_router(documents.router, prefix=settings.API_V1_STR)
app.include_router(admin_auth.router, prefix=settings.API_V1_STR)
app.include_router(admin_dashboard.router, prefix=settings.API_V1_STR)


#  STATIC FILES & FRONTEND
# 1. Serve the embeddable widget
widget_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../embed"))
if os.path.exists(widget_path):
    app.mount("/widget", StaticFiles(directory=widget_path), name="widget")

# 2. Serve the React frontend build
frontend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/build"))
if os.path.exists(frontend_path):
    # Serve static assets (js, css, etc.)
    app.mount("/static", StaticFiles(directory=os.path.join(frontend_path, "static")), name="static")
    
    # Handle React routes (catch-all)
    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        # If the path looks like a file (has an extension), try to serve it from frontend_path
        file_path = os.path.join(frontend_path, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        # Otherwise, serve index.html for React Router to handle
        return FileResponse(os.path.join(frontend_path, "index.html"))
