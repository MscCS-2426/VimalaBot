import csv
import os
from datetime import datetime

# Get the backend root directory (3 levels up from app/utils/logger.py)
BACKEND_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOG_FILE = os.path.join(BACKEND_ROOT, "data", "chat_logs.csv")

def log_interaction(role: str, content: str):
    """
    Log a chat interaction to a CSV file.
    role: 'User' or 'Assistant'
    content: The message content
    """
    # Ensure directory exists
    os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
    
    file_exists = os.path.isfile(LOG_FILE)
    
    with open(LOG_FILE, mode='a', newline='', encoding='utf-8') as f:
        writer = csv.writer(f)
        # Write header if new file
        if not file_exists:
            writer.writerow(['Role', 'Message', 'Timestamp'])
        
        # Log the message
        writer.writerow([role, content, datetime.now().isoformat()])

def get_log_file_path():
    return LOG_FILE
