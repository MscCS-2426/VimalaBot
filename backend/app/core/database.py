import os
import chromadb
from sentence_transformers import SentenceTransformer
from functools import lru_cache
from .config import settings
import logging


@lru_cache()
def get_embedding_model():
    """Get the embedding model instance (cached)"""
    primary_model_name = settings.EMBEDDING_MODEL
    fallback_model_names = [
        "sentence-transformers/all-MiniLM-L6-v2",
        "all-MiniLM-L6-v2",
        "sentence-transformers/all-MiniLM-L12-v2",
    ]

    try:
        return SentenceTransformer(primary_model_name)
    except Exception as exc:
        logging.warning(
            "Failed to load embedding model '%s' (%s). Falling back to a default model...",
            primary_model_name,
            str(exc),
        )
        for candidate in fallback_model_names:
            try:
                logging.info("Attempting fallback embedding model: %s", candidate)
                return SentenceTransformer(candidate)
            except Exception:
                continue

        raise


def get_chroma_client():
    """Get ChromaDB client instance"""
    # Honor telemetry preference to avoid sending any analytics
    if getattr(settings, "DISABLE_TELEMETRY", False):
        os.environ.setdefault("ANONYMIZED_TELEMETRY", "False")
        os.environ.setdefault("CHROMA_TELEMETRY_ENABLED", "False")
        os.environ.setdefault("CHROMA_ANALYTICS_ENABLED", "False")
    return chromadb.PersistentClient(path=settings.CHROMA_DB_PATH)


def get_chroma_collection(collection_name: str = "default"):
    """Get or create a ChromaDB collection"""
    client = get_chroma_client()
    try:
        collection = client.get_collection(name=collection_name)
    except Exception:
        collection = client.create_collection(name=collection_name)
    return collection
