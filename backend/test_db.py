from app.core.database import get_chroma_collection
from app.core.config import settings

print("DB PATH:", settings.CHROMA_DB_PATH)

collection = get_chroma_collection("default")
print("Total documents in DB:", collection.count())