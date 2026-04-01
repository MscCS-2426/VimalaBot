from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import List
from ..models.document import (
    DocumentUpload, BulkDocumentUpload, CollectionCreate, 
    DocumentInfo, DocumentDetails, CollectionInfo
)
from ..services.document_service import document_service
from ..core.database import get_chroma_client

router = APIRouter(prefix="/documents", tags=["Document Management"])


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...), 
    collection_name: str = Form("default"), 
    metadata: str = Form("{}")
):
    """Upload and process a document file"""
    return document_service.upload_document(file, collection_name, metadata)


@router.post("/embed")
async def embed_text_content(document: DocumentUpload, collection_name: str = "default"):
    """Embed text content directly"""
    return document_service.embed_text_content(document, collection_name)


@router.post("/bulk-embed")
async def bulk_embed_documents(bulk_data: BulkDocumentUpload, collection_name: str = "default"):
    """Embed multiple documents"""
    return document_service.bulk_embed_documents(bulk_data.documents, collection_name)


@router.get("/", response_model=dict)
async def list_documents(collection_name: str = "default", limit: int = 100):
    """List all documents in a collection"""
    return document_service.list_documents(collection_name, limit)


# Collection Management Routes (must be before /{doc_id} to avoid route conflicts)
@router.get("/collections/list", response_model=dict)
async def list_collections():
    """List all available collections"""
    try:
        client = get_chroma_client()
        collections = client.list_collections()
        collection_info = []
        for collection in collections:
            count = collection.count()
            collection_info.append({
                "name": collection.name,
                "id": collection.id,
                "document_count": count,
                "metadata": collection.metadata
            })
        return {"collections": collection_info}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/collections/create")
async def create_collection(collection_data: CollectionCreate):
    """Create a new collection"""
    try:
        client = get_chroma_client()
        # Ensure metadata is a plain dict
        metadata = dict(collection_data.metadata or {})
        # Some vector stores reject empty metadata; pass None instead of {}
        if not metadata:
            metadata = None
        existing_collections = [col.name for col in client.list_collections()]
        if collection_data.name in existing_collections:
            if collection_data.overwrite:
                client.delete_collection(name=collection_data.name)
            else:
                raise HTTPException(status_code=400, detail=f"Collection '{collection_data.name}' already exists")

        # Create the collection after optional overwrite
        if hasattr(client, "get_or_create_collection"):
            collection = client.get_or_create_collection(name=collection_data.name, metadata=metadata)
        else:
            collection = client.create_collection(name=collection_data.name, metadata=metadata)
        return {
            "message": "Collection created successfully",
            "name": collection.name,
            "id": collection.id,
            "metadata": collection.metadata
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/collections/{collection_name}")
async def delete_collection(collection_name: str):
    """Delete a collection"""
    try:
        client = get_chroma_client()
        client.delete_collection(name=collection_name)
        return {"message": f"Collection '{collection_name}' deleted successfully"}
    except Exception as e:
        if "does not exist" in str(e).lower():
            raise HTTPException(status_code=404, detail="Collection not found")
        raise HTTPException(status_code=500, detail=str(e))


# Document-by-ID routes (after /collections/* to avoid route conflicts)
@router.get("/{doc_id}", response_model=DocumentDetails)
async def get_document_details(doc_id: str, collection_name: str = "default"):
    """Get detailed information about a specific document"""
    return document_service.get_document_details(doc_id, collection_name)


@router.delete("/{doc_id}")
async def delete_document(doc_id: str, collection_name: str = "default"):
    """Delete a document from the collection"""
    return document_service.delete_document(doc_id, collection_name)


@router.put("/{doc_id}")
async def update_document(doc_id: str, document: DocumentUpload, collection_name: str = "default"):
    """Update a document by replacing it"""
    return document_service.update_document(doc_id, document, collection_name)
