from app.core.database import get_chroma_collection

collection = get_chroma_collection("default")

collection.delete(where={})

print("✅ Database cleared successfully")