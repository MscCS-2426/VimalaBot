from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

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
