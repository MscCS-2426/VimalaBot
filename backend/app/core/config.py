import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import field_validator


class Settings(BaseSettings):
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Chatbot API"

    # CORS Configuration
    BACKEND_CORS_ORIGINS: str = "http://localhost:3000,http://localhost:3001"

    @field_validator('BACKEND_CORS_ORIGINS')
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(',')]
        return v

    # Database Configuration
    CHROMA_DB_PATH: str = "./chroma_db"
    DISABLE_TELEMETRY: bool = True

    # AI Configuration
    GROQ_API_KEY: Optional[str] = None
    GROQ_MODEL: str = "meta-llama/llama-4-scout-17b-16e-instruct"
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"

    # Chat Configuration
    MAX_TOKENS: int = 500
    TEMPERATURE: float = 0.1
    TOP_P: float = 1.0
    N_RESULTS: int = 5
    BASE_SYSTEM_PROMPT: str = (
        "You are a helpful AI assistant. Based on the provided context, answer the user's "
        "question accurately and concisely. If the context doesn't contain relevant information, "
        "politely say so and provide a general helpful response if possible."
    )


    ADMIN_USERNAME: str
    ADMIN_PASSWORD: str
    ADMIN_SECRET_KEY: str

    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


settings = Settings()
