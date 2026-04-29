from fastapi import APIRouter, HTTPException
from ..models.chat import (
    ChatMessage, ChatResponse, SessionCreate, SessionResponse, 
    SessionListResponse, ChatHistory, SessionInfo
)
from ..services.chat_service import chat_service
from datetime import datetime

router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
    responses={404: {"description": "Not found"}},
)


@router.post("/", response_model=ChatResponse, summary="Send a chat message",
             description="Send a message to the AI assistant and get a response based on relevant context from the knowledge base")
async def chat(message: ChatMessage):
    """
    Send a chat message and receive an AI-generated response.

    - **message**: The user's question or message
    - **session_id**: Optional session ID (auto-generated if not provided)
    - **collection_name**: ChromaDB collection to search (default: "default")

    Returns the AI response along with relevant source documents.
    """
    try:
        return chat_service.process_chat_message(message)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}", response_model=ChatHistory, summary="Get chat history",
            description="Retrieve the complete chat history for a specific session")
async def get_chat_history(session_id: str):
    """
    Get the complete chat history for a session.

    - **session_id**: The session ID to retrieve history for

    Returns the complete conversation history.
    """
    history = chat_service.get_chat_history(session_id)
    if not history:
        raise HTTPException(status_code=404, detail="Session not found")
    return ChatHistory(session_id=session_id, history=history)


@router.post("/session", response_model=SessionResponse, summary="Create new chat session",
             description="Create a new chat session with optional user ID and metadata")
async def create_chat_session(session_data: SessionCreate):
    """
    Create a new chat session.

    - **user_id**: Optional user identifier
    - **metadata**: Additional session metadata

    Returns the new session information.
    """
    session_id = chat_service.create_session(
        user_id=session_data.user_id,
        metadata=session_data.metadata
    )
    return SessionResponse(
        session_id=session_id,
        created_at=datetime.now().isoformat(),
        user_id=session_data.user_id,
        metadata=session_data.metadata
    )


@router.delete("/session/{session_id}", summary="Delete chat session",
               description="Delete a specific chat session and all its history")
async def delete_chat_session(session_id: str):
    """
    Delete a chat session and all its history.

    - **session_id**: The session ID to delete

    Returns confirmation of deletion.
    """
    if not chat_service.delete_session(session_id):
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "message": f"Session {session_id} deleted successfully",
        "deleted_at": datetime.now().isoformat()
    }


@router.get("/sessions", response_model=SessionListResponse, summary="List all chat sessions",
            description="Get a list of all active chat sessions with their basic information")
async def list_chat_sessions():
    """
    List all active chat sessions.

    Returns summary information for all sessions including message count and activity timestamps.
    """
    sessions_info = chat_service.list_sessions()
    sessions = [SessionInfo(**session) for session in sessions_info]
    return SessionListResponse(
        total_sessions=len(sessions),
        sessions=sessions
    )


@router.post("/stream", summary="Stream chat response",
             description="Send a message and get a streaming response (basic implementation)")
async def stream_chat(message: ChatMessage):
    """
    Send a message and receive a streaming response.

    Note: This is a basic implementation. For true streaming, implement Server-Sent Events (SSE) or WebSocket.
    """
    try:
        response = chat_service.process_chat_message(message)
        return {
            "message": "Streaming response",
            "response": response.response,
            "session_id": response.session_id,
            "sources": response.sources,
            "note": "This is a basic implementation. Use SSE or WebSocket for true streaming."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

