import uuid
from datetime import datetime
from typing import List, Dict, Any
from fastapi import UploadFile, HTTPException
import pypdf
import docx
import io
import json
from ..core.database import get_chroma_collection, get_embedding_model
from ..models.document import DocumentUpload, CollectionCreate


class DocumentService:
    def __init__(self):
        self.embedding_model = get_embedding_model()
    
    def extract_text_from_file(self, file: UploadFile) -> str:
        """Extract text content from uploaded file"""
        content = file.file.read()

        if file.filename.endswith('.pdf'):
            pdf_reader = pypdf.PdfReader(io.BytesIO(content))
            text = ""
            for page in pdf_reader.pages:
                text += page.extract_text()
            return text

        elif file.filename.endswith('.docx'):
            doc = docx.Document(io.BytesIO(content))
            text = ""
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
            return text

        elif file.filename.endswith('.txt'):
            return content.decode('utf-8')

        else:
            raise HTTPException(status_code=400, detail="Unsupported file format")
    
    def chunk_text(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Split text into overlapping chunks"""
        chunks = []
        start = 0
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            chunks.append(chunk)
            start = end - overlap
            if end >= len(text):
                break
        return chunks
    
    def process_and_store_document(self, content: str, title: str, metadata: Dict, collection_name: str) -> Dict:
        """Process document content and store in ChromaDB"""
        chunks = self.chunk_text(content)
        collection = get_chroma_collection(collection_name)
        doc_id = str(uuid.uuid4())
        embeddings = self.embedding_model.encode(chunks).tolist()

        metadatas = [
            {
                "title": title,
                "doc_id": doc_id,
                "chunk_index": i,
                "upload_date": datetime.now().isoformat(),
                **metadata
            } for i in range(len(chunks))
        ]
        ids = [f"{doc_id}_chunk_{i}" for i in range(len(chunks))]
        collection.add(documents=chunks, embeddings=embeddings, metadatas=metadatas, ids=ids)
        
        return {
            "doc_id": doc_id,
            "title": title,
            "chunks_created": len(chunks),
            "collection": collection_name
        }
    
    def upload_document(self, file: UploadFile, collection_name: str = "default", metadata: str = "{}") -> Dict:
        """Upload and process a document file"""
        try:
            doc_metadata = json.loads(metadata) if metadata != "{}" else {}
            text_content = self.extract_text_from_file(file)
            result = self.process_and_store_document(
                content=text_content,
                title=file.filename,
                metadata={**doc_metadata, "source": file.filename, "file_type": file.content_type},
                collection_name=collection_name
            )
            return {"message": "Document uploaded successfully", "filename": file.filename, **result}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def embed_text_content(self, document: DocumentUpload, collection_name: str = "default") -> Dict:
        """Embed text content directly"""
        try:
            result = self.process_and_store_document(
                content=document.content,
                title=document.title,
                metadata=document.metadata,
                collection_name=collection_name
            )
            return {"message": "Content embedded successfully", **result}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def bulk_embed_documents(self, documents: List[DocumentUpload], collection_name: str = "default") -> Dict:
        """Embed multiple documents"""
        try:
            results = []
            for document in documents:
                result = self.process_and_store_document(
                    content=document.content,
                    title=document.title,
                    metadata=document.metadata,
                    collection_name=collection_name
                )
                results.append(result)
            return {
                "message": f"Successfully embedded {len(results)} documents",
                "collection": collection_name,
                "documents": results,
                "total_chunks": sum(r["chunks_created"] for r in results)
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def list_documents(self, collection_name: str = "default", limit: int = 100) -> Dict:
        """List all documents in a collection"""
        try:
            collection = get_chroma_collection(collection_name)
            results = collection.get(limit=limit)
            documents = {}
            for metadata in results['metadatas']:
                doc_id = metadata.get('doc_id')
                if doc_id not in documents:
                    documents[doc_id] = {
                        "doc_id": doc_id,
                        "source": metadata.get('source', 'Unknown'),
                        "title": metadata.get('title', 'Untitled'),
                        "upload_date": metadata.get('upload_date'),
                        "file_type": metadata.get('file_type', 'text'),
                        "chunk_count": 0
                    }
                documents[doc_id]["chunk_count"] += 1
            return {
                "collection": collection_name,
                "total_documents": len(documents),
                "documents": list(documents.values())
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def get_document_details(self, doc_id: str, collection_name: str = "default") -> Dict:
        """Get detailed information about a specific document"""
        try:
            collection = get_chroma_collection(collection_name)
            results = collection.get(where={"doc_id": doc_id})
            if not results['ids']:
                raise HTTPException(status_code=404, detail="Document not found")
            chunks = []
            for i, (chunk_id, document, metadata) in enumerate(zip(results['ids'], results['documents'], results['metadatas'])):
                chunks.append({
                    "chunk_id": chunk_id,
                    "chunk_index": metadata.get('chunk_index', i),
                    "content": document,
                    "metadata": metadata
                })
            chunks.sort(key=lambda x: x['chunk_index'])
            doc_metadata = chunks[0]['metadata'] if chunks else {}
            return {
                "doc_id": doc_id,
                "title": doc_metadata.get('title', 'Untitled'),
                "source": doc_metadata.get('source', 'Unknown'),
                "upload_date": doc_metadata.get('upload_date'),
                "chunk_count": len(chunks),
                "chunks": chunks
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def delete_document(self, doc_id: str, collection_name: str = "default") -> Dict:
        """Delete a document from the collection"""
        try:
            collection = get_chroma_collection(collection_name)
            results = collection.get(where={"doc_id": doc_id})
            if not results['ids']:
                raise HTTPException(status_code=404, detail="Document not found")
            collection.delete(ids=results['ids'])
            return {
                "message": "Document deleted successfully",
                "doc_id": doc_id,
                "chunks_deleted": len(results['ids'])
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
    
    def update_document(self, doc_id: str, document: DocumentUpload, collection_name: str = "default") -> Dict:
        """Update a document by replacing it"""
        try:
            self.delete_document(doc_id, collection_name)
            result = self.process_and_store_document(
                content=document.content,
                title=document.title,
                metadata=document.metadata,
                collection_name=collection_name
            )
            return {"message": "Document updated successfully", "old_doc_id": doc_id, **result}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))


# Global instance
document_service = DocumentService()
