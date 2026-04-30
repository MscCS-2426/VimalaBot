from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


class ChatMessage(BaseModel):
    message: str = Field(..., description="The user's message/query", min_length=1)
    session_id: Optional[str] = Field(None, description="Optional session ID. If not provided, a new session will be created")
    collection_name: str = Field("default", description="ChromaDB collection name to query against")
    # Optional per-request overrides
    groq_model: Optional[str] = Field(None, description="Override model for this request")
    max_tokens: Optional[int] = Field(None, description="Override max tokens for this request")
    temperature: Optional[float] = Field(None, description="Override temperature for this request")
    top_p: Optional[float] = Field(None, description="Override top_p for this request")
    system_prompt: Optional[str] = Field(None, description="Optional system prompt to prepend to the conversation")


class ChatResponse(BaseModel):
    response: str = Field(..., description="AI-generated response to the user's query")
    session_id: str = Field(..., description="Session ID for this conversation")
    sources: List[Dict[str, Any]] = Field(default=[], description="Relevant source documents used to generate the response")
    follow_up_questions: List[str] = Field(default=[], description="Suggested follow-up questions for the user")


class SessionCreate(BaseModel):
    user_id: Optional[str] = Field(None, description="Optional user identifier")
    metadata: Dict[str, Any] = Field(default={}, description="Additional metadata for the session")


class SessionInfo(BaseModel):
    session_id: str
    message_count: int
    last_activity: Optional[str]
    created_at: Optional[str]


class SessionResponse(BaseModel):
    session_id: str
    created_at: str
    user_id: Optional[str]
    metadata: Dict[str, Any]


class SessionListResponse(BaseModel):
    total_sessions: int
    sessions: List[SessionInfo]


class ChatHistory(BaseModel):
    session_id: str
    history: List[Dict[str, Any]]
