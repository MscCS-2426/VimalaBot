import os
from langchain_text_splitters import RecursiveCharacterTextSplitter
from sentence_transformers import SentenceTransformer
from app.core.database import get_chroma_collection

# Paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
SCRAPER_FILE = os.path.join(BASE_DIR, "..", "scraper", "export", "all.md")

# Load model
model = SentenceTransformer("all-MiniLM-L6-v2")

# Use SAME DB as backend
collection = get_chroma_collection("default")


def ingest_data():
    if not os.path.exists(SCRAPER_FILE):
        print("Scraper file not found!")
        return

    with open(SCRAPER_FILE, "r", encoding="utf-8") as f:
        text = f.read()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=300,
        chunk_overlap=100
    )
    chunks = splitter.split_text(text)

    print(f"Total chunks: {len(chunks)}")

    embeddings = model.encode(chunks)

    for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
        collection.add(
            documents=[chunk],
            embeddings=[emb.tolist()],
            ids=[str(i)]
        )

    print("✅ Data ingested into ChromaDB")