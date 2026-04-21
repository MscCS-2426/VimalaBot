import os
print("RUNNING FILE:", os.path.abspath(__file__))
import uuid
from sentence_transformers import SentenceTransformer
from app.core.database import get_chroma_collection
from docx import Document

print("INGEST FILE RUNNING")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
#SCRAPER_FILE = os.path.join(BASE_DIR, "..", "scraper", "export", "all.md")
SCRAPER_FILE = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "../../../export/all.docx")
)
print("FILE PATH:", SCRAPER_FILE)
print("EXISTS:", os.path.exists(SCRAPER_FILE))
model = SentenceTransformer("all-MiniLM-L6-v2")
collection = get_chroma_collection("default")
print("CALLING INGEST FUNCTION NOW")

def clean_text(text):
    lines = text.split("\n")
    cleaned = []

    for line in lines:
        line = line.strip()

        # remove junk
        if len(line) < 40:
            continue
        if "Home" in line and "Admissions" in line:
            continue

        cleaned.append(line)

    return "\n".join(cleaned)


def split_by_sections(text, chunk_size=500):
    words = text.split()
    chunks = []

    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i+chunk_size])
        chunks.append(chunk)

    return chunks


def ingest_data():
    doc = Document(SCRAPER_FILE)
    text = "\n".join([p.text for p in doc.paragraphs])

    text = clean_text(text)
    chunks = split_by_sections(text)

    print(f"Clean chunks: {len(chunks)}")

    embeddings = model.encode(chunks)
    ids = [str(uuid.uuid4()) for _ in chunks]

    collection.add(
        documents=chunks,
        embeddings=[emb.tolist() for emb in embeddings],
        ids=ids
    )

    print("✅ Clean data ingested")


# 🔥 THIS MUST BE OUTSIDE THE FUNCTION
print("CALLING INGEST FUNCTION")
ingest_data()