import uuid
from datetime import datetime
from typing import List, Dict, Any
from groq import Groq
from ..core.config import settings
from ..core.database import get_chroma_collection, get_embedding_model
from ..models.chat import ChatMessage, ChatResponse


class ChatService:
    def __init__(self):
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        self.embedding_model = get_embedding_model()
        self.chat_sessions = {}

    def generate_response(self, query: str, context: List[str], *,
                          groq_model: str = None,
                          max_tokens: int = None,
                          temperature: float = None,
                          top_p: float = None,
                          system_prompt_override: str = None) -> str:
        """Generate AI response using Groq API with provided context"""
        context_text = "\n\n".join(context)
        system_prompt = system_prompt_override or settings.BASE_SYSTEM_PROMPT
        user_prompt = f"""
        You are an AI assistant.

        Answer ONLY using the provided context.
        If the answer is not in the context, say: "Iam afraid, I can't help with the provided Query".

        Context:
        {context_text}

        Question: {query}

        Give a clear and structured answer.
        """
        try:
            response = self.groq_client.chat.completions.create(
                model=groq_model or settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_tokens=max_tokens or settings.MAX_TOKENS,
                temperature=temperature if temperature is not None else settings.TEMPERATURE,
            top_p=top_p if top_p is not None else settings.TOP_P,
                stream=False
            )
            return response.choices[0].message.content
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def process_chat_message(self, message: ChatMessage) -> ChatResponse:
        """Process a chat message and return AI response"""
        if not message.session_id:
            message.session_id = str(uuid.uuid4())
            self.chat_sessions[message.session_id] = []

        collection = get_chroma_collection(message.collection_name)

        query_embedding = self.embedding_model.encode([message.message]).tolist()

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=8
        )

        raw_docs = results.get('documents', [[]])[0]

        # Remove duplicates
        seen = set()
        context = []
        for doc in raw_docs:
            if doc not in seen:
                seen.add(doc)
                context.append(doc)

        sources = []
        metadatas = results.get('metadatas', [[]])[0]
        distances = results.get('distances', [[]])[0]

        for doc, meta, dist in zip(context, metadatas, distances):
            sources.append({
                "content": doc[:300],
                "metadata": meta,
                "distance": dist
            })

        ai_response = self.generate_response(
            message.message,
            context,
            groq_model=message.groq_model,
            max_tokens=message.max_tokens,
            temperature=message.temperature,
            top_p=message.top_p,
            system_prompt_override=message.system_prompt,
        )

        # Store conversation history
        self.chat_sessions[message.session_id].append({
            "role": "user",
            "content": message.message,
            "timestamp": datetime.now().isoformat()
        })
        self.chat_sessions[message.session_id].append({
            "role": "assistant",
            "content": ai_response,
            "timestamp": datetime.now().isoformat()
        })

        return ChatResponse(
            response=ai_response,
            session_id=message.session_id,
            sources=sources
        )

    def get_chat_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get chat history for a session"""
        return self.chat_sessions.get(session_id, [])

    def create_session(self, user_id: str = None, metadata: Dict[str, Any] = None) -> str:
        """Create a new chat session"""
        session_id = str(uuid.uuid4())
        self.chat_sessions[session_id] = []
        return session_id

    def delete_session(self, session_id: str) -> bool:
        """Delete a chat session"""
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]
            return True
        return False

    def list_sessions(self) -> List[Dict[str, Any]]:
        """List all chat sessions"""
        sessions_info = []
        for session_id, messages in self.chat_sessions.items():
            sessions_info.append({
                "session_id": session_id,
                "message_count": len(messages),
                "last_activity": messages[-1]["timestamp"] if messages else None,
                "created_at": messages[0]["timestamp"] if messages else None
            })
        return sessions_info


# Global instance
chat_service = ChatService()
