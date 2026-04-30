import uuid
import re
from datetime import datetime
from typing import List, Dict, Any

from groq import Groq

from ..core.config import settings
from ..core.database import get_chroma_collection, get_embedding_model
from ..models.chat import ChatMessage, ChatResponse

TRAINING_PROMPT = """You are a Professional Admission Enquiry Chatbot for Vimala College (Autonomous), Thrissur, Kerala, India.
CORE FACTS (ALWAYS TRUE):
- Name: Vimala College (Autonomous)
- Location: Thrissur, Kerala, India
- Affiliation: University of Calicut (also known as Calicut University)

ROLE:
Provide accurate, polite, concise, structured information ONLY about:
- College details
- Courses (UG, PG, PhD)
ROLE:
Provide accurate, polite, concise, structured information ONLY about:
- College details
- Courses (UG, PG, PhD)
- Eligibility
- Admission process
- Documents
- Application (OAP)
- Timelines

RESPONSE RULES:
- Max 2–4 lines
- Formal tone
- No emojis, no slang
- No unnecessary explanation
- Structured format preferred

ELIGIBILITY FORMATTING:
When you provide eligibility criteria for ANY course, you MUST format the entire criteria as bullet points. Do NOT use paragraph format for eligibility.

STRICT BEHAVIOR:
- Always polite and professional
- Never argue
- Ask clarification if UG/PG unclear
- Maintain session consistency

SCOPE RESTRICTION:
Allowed: admissions, academics, documents
Not allowed: politics, religion, legal advice, medical advice, comparisons, opinions
If unrelated:
"I am designed to assist only with information related to Vimala College (Autonomous), Thrissur admissions and academic programs."

NO HALLUCINATION:
- Answer ONLY using the provided context.
- If the provided context contains the answer, provide it and DO NOT use the fallback phrase.

DATE SAFETY:
Do not generate dates → refer to website

RANKING SAFETY:
Do not generate rankings → refer to official website

LEGAL GUARDRAIL:
No legal advice → redirect to official guidelines

SCHOLARSHIP GUARDRAIL:
Do not promise financial benefits

EMOTIONAL HANDLING:
Be empathetic but not a counselor

LANGUAGE:
Always English only

NO COMPARISON:
Do not compare colleges

ABUSE HANDLING:
Stay calm, redirect to topic

DATA PRIVACY:
Never ask for sensitive data

COURSE FORMAT:
- Duration
- Eligibility (ALWAYS as bullet points)

FOLLOW-UP SUGGESTIONS:
Provide 1-2 short, relevant follow-up suggestions the user can say or ask next. Format them exactly like this at the very end of your response:
<FOLLOWUP>Suggestion 1</FOLLOWUP>
<FOLLOWUP>Suggestion 2</FOLLOWUP>
*IMPORTANT*: When asked about programs offered by the college, ALWAYS include these three specific follow-ups:
<FOLLOWUP>UG</FOLLOWUP>
<FOLLOWUP>PG</FOLLOWUP>
<FOLLOWUP>PhD</FOLLOWUP>

FALLBACK:
"I may not have the most updated official information. Please refer to vimalacollege.edu.in"

SPELLING:
Understand typos automatically

TERMINOLOGY:
"Vimala", "College" = Vimala College
"pg programs","pg Programs","pg prgm","pg programme", "pg"= pg courses

CONTEXT AWARENESS:
Use previous conversation

INTENT:
If unclear → ask clarification
"""


class ChatService:
    def __init__(self):
        self.groq_client = Groq(api_key=settings.GROQ_API_KEY)
        self.embedding_model = get_embedding_model()
        self.chat_sessions = {}

    #SESSION MANAGEMENT METHODS
    def create_session(self, user_id: str = None, metadata: dict = None) -> str:
        session_id = str(uuid.uuid4())
        self.chat_sessions[session_id] = []
        return session_id

    def get_chat_history(self, session_id: str) -> List[Dict[str, Any]]:
        return self.chat_sessions.get(session_id)

    def delete_session(self, session_id: str) -> bool:
        if session_id in self.chat_sessions:
            del self.chat_sessions[session_id]
            return True
        return False

    def list_sessions(self) -> List[Dict[str, Any]]:
        sessions_info = []
        for session_id, history in self.chat_sessions.items():
            message_count = len(history)
            last_activity = history[-1]["timestamp"] if history else None
            created_at = history[0]["timestamp"] if history else datetime.now().isoformat()

            sessions_info.append({
                "session_id": session_id,
                "message_count": message_count,
                "last_activity": last_activity,
                "created_at": created_at
            })
        return sessions_info

    #END SESSION MANAGEMENT METHODS

    def is_valid_query(self, query: str) -> bool:
        blocked = ["hack", "attack", "illegal", "porn", "sex"]
        return not any(word in query.lower() for word in blocked)

    def validate_response(self, response: str) -> str:
        if not response.strip():
            return "I do not have official information about that. Please refer to the official website."
        return response

    def generate_response(
            self,
            query: str,
            context: List[str],
            history: List[Dict[str, Any]] = None,
            *,
            groq_model: str = None,
            max_tokens: int = None,
            temperature: float = None,
            top_p: float = None,
            system_prompt_override: str = None,
    ) -> str:
        context_text = "\n\n".join(context)
        system_prompt = system_prompt_override or TRAINING_PROMPT
        user_prompt = f"""Context:\n{context_text}\n\nQuestion: {query}"""

        messages = [{"role": "system", "content": system_prompt}]


        if history:
            for msg in history :
                messages.append({"role": msg["role"], "content": msg["content"]})

        messages.append({"role": "user", "content": user_prompt})

        try:
            response = self.groq_client.chat.completions.create(
                model=groq_model or settings.GROQ_MODEL,
                messages=messages,
                max_tokens=max_tokens or settings.MAX_TOKENS,
                temperature=temperature if temperature is not None else settings.TEMPERATURE,
                top_p=top_p if top_p is not None else settings.TOP_P,
                stream=False,
            )
            return self.validate_response(response.choices[0].message.content)
        except Exception as e:
            return f"Error generating response: {str(e)}"

    def process_chat_message(self, message: ChatMessage) -> ChatResponse:
        if not self.is_valid_query(message.message):
            return ChatResponse(
                response="I am here to assist with admission-related queries for Vimala College.",
                session_id=message.session_id or "blocked",
                sources=[]
            )

        if not message.session_id:
            message.session_id = str(uuid.uuid4())
            self.chat_sessions[message.session_id] = []

        # Get the history for this session
        session_history = self.chat_sessions[message.session_id]

        # Contextual search logic
        search_query = message.message
        # If the user gives a short answer, attach the last bot question for better RAG retrieval
        if len(session_history) > 0 and len(message.message.split()) < 5:
            last_bot_msg = session_history[-1]["content"]
            search_query = f"{last_bot_msg} {message.message}"

        collection = get_chroma_collection(message.collection_name)
        query_embedding = self.embedding_model.encode([search_query]).tolist()

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=8
        )

        context = results.get('documents', [[]])[0]

        distances = results.get('distances', [[]])[0]

        metadatas = results.get('metadatas', [[]])[0]

        if not context:
            return ChatResponse(
                response="I do not have official information about that. Please refer to the official website.",
                session_id=message.session_id,
                sources=[]
            )

        sources = []
        for doc, meta, dist in zip(context, metadatas, distances):
            sources.append({
                "content": doc[:300],
                "metadata": meta,
                "distance": dist
            })

        ai_response = self.generate_response(
            query=message.message,
            context=context,
            history=session_history,
            groq_model=message.groq_model,
            max_tokens=message.max_tokens,
            temperature=message.temperature,
            top_p=message.top_p,
            system_prompt_override=message.system_prompt,
        )

        follow_up_questions = re.findall(r'<FOLLOWUP>(.*?)</FOLLOWUP>', ai_response, flags=re.IGNORECASE)
        clean_response = re.sub(r'<FOLLOWUP>.*?</FOLLOWUP>', '', ai_response, flags=re.IGNORECASE | re.DOTALL).strip()

        self.chat_sessions[message.session_id].append({
            "role": "user",
            "content": message.message,
            "timestamp": datetime.now().isoformat()
        })

        self.chat_sessions[message.session_id].append({
            "role": "assistant",
            "content": clean_response,
            "timestamp": datetime.now().isoformat()
        })

        return ChatResponse(
            response=clean_response,
            session_id=message.session_id,
            sources=sources,
            follow_up_questions=follow_up_questions
        )


chat_service = ChatService()