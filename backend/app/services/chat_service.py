import uuid
from datetime import datetime
from typing import List, Dict, Any
from groq import Groq
from ..core.config import settings
from ..core.database import get_chroma_collection, get_embedding_model
from ..models.chat import ChatMessage, ChatResponse


# ✅ YOUR ORIGINAL PROMPT (UNCHANGED)
TRAINING_PROMPT = """
You are a Professional Admission Enquiry Chatbot for Vimala College (Autonomous), Thrissur, Kerala, India.

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
- Use ONLY provided context
- Do NOT assume or guess
- If missing:
"I do not have official information about that. Please refer to the official website."

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
- Eligibility

FOLLOW-UP:
Add one short helpful follow-up

FALLBACK:
"I may not have the most updated official information. Please refer to vimalacollege.edu.in"

SPELLING:
Understand typos automatically

TERMINOLOGY:
"Vimala", "College" = Vimala College

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
        *,
        groq_model: str = None,
        max_tokens: int = None,
        temperature: float = None,
        top_p: float = None,
        system_prompt_override: str = None,
    ) -> str:

        context_text = "\n\n".join(context)

        system_prompt = system_prompt_override or TRAINING_PROMPT

        user_prompt = f"""
        Answer the question based on the context.

        Context:
        {context}

        Question:
        {query}
        """




        try:
            response = self.groq_client.chat.completions.create(
                model=groq_model or settings.GROQ_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt},
                ],
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

        collection = get_chroma_collection(message.collection_name)

        query_embedding = self.embedding_model.encode([message.message]).tolist()

        results = collection.query(
            query_embeddings=query_embedding,
            n_results=8
        )

        # ✅ FIXED CLEAN BLOCK
        context = results.get('documents', [[]])[0]
        distances = results.get('distances', [[]])[0]
        metadatas = results.get('metadatas', [[]])[0]

        # ✅ NO CONTEXT
        if not context:
            return ChatResponse(
                response="I do not have official information about that. Please refer to the official website.",
                session_id=message.session_id,
                sources=[]
            )

        # ✅ BUILD SOURCES
        sources = []
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


chat_service = ChatService()