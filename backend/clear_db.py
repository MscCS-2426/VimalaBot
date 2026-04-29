from app.core.database import get_chroma_collection

print("Connecting to database...")
collection = get_chroma_collection("default")

# 1. Get all existing documents
existing_docs = collection.get()
ids_to_delete = existing_docs.get('ids', [])

# 2. If there are documents, delete them by their specific IDs
if ids_to_delete:
    collection.delete(ids=ids_to_delete)
    print(f"✅ Successfully cleared {len(ids_to_delete)} chunks from the database.")
else:
    print("✅ Database is already empty.")