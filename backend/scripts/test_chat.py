import os
import sys
from dotenv import load_dotenv

# Add the backend directory to sys.path so we can import from app
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(base_dir)

# Load environment variables from backend/.env
env_path = os.path.join(base_dir, '.env')
load_dotenv(env_path)

from app.services.chat_service import ChatService
from app.models.chat import ChatMessage

def main():
    service = ChatService()
    
    questions = [
        "What are the PhD programs available?",
        "Please list all the available courses you have.",
        "What is the admission procedure?",
        "How many Nobel laureates visited the college?"
    ]
    
    session_id = None
    
    for q in questions:
        message = ChatMessage(message=q, session_id=session_id)
        response = service.process_chat_message(message)
        session_id = response.session_id
        
        print(f"User: {message.message}")
        print(f"Bot:\n{response.response}")
        print("\n----------------\n")

if __name__ == "__main__":
    main()
