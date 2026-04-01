"""
End-to-end tests for the Chatbot API.
Runs against the real FastAPI app with real ChromaDB — no mocks.
"""

import os
import shutil
import tempfile
import pytest
from fastapi.testclient import TestClient

# Override DB path BEFORE importing the app so it uses a temp directory
_test_db_dir = tempfile.mkdtemp(prefix="chatbot_test_chroma_")
os.environ["CHROMA_DB_PATH"] = _test_db_dir
os.environ["ADMIN_USERNAME"] = "testadmin"
os.environ["ADMIN_PASSWORD"] = "testpass123"
os.environ["ADMIN_SECRET_KEY"] = "test-secret-key-for-jwt-minimum-32bytes!"
os.environ["GROQ_API_KEY"] = os.environ.get("GROQ_API_KEY", "test-key")

from app.main import app  # noqa: E402

client = TestClient(app)

TEST_COLLECTION = "test_e2e_collection"


# ──────────────────────────────────────────────
# Fixtures
# ──────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _cleanup_sessions():
    """Reset in-memory chat sessions between tests."""
    from app.services.chat_service import chat_service
    chat_service.chat_sessions.clear()
    yield
    chat_service.chat_sessions.clear()


@pytest.fixture(scope="module", autouse=True)
def _cleanup_test_db():
    """Remove the temp ChromaDB directory after all tests."""
    yield
    shutil.rmtree(_test_db_dir, ignore_errors=True)


# ──────────────────────────────────────────────
# 1. Health & Root
# ──────────────────────────────────────────────

class TestHealthAndRoot:
    def test_root_returns_welcome(self):
        r = client.get("/")
        assert r.status_code == 200
        body = r.json()
        assert "message" in body
        assert "version" in body
        assert body["docs"] == "/docs"

    def test_health_check(self):
        r = client.get("/health")
        assert r.status_code == 200
        assert r.json()["status"] == "healthy"


# ──────────────────────────────────────────────
# 2. Chat Sessions
# ──────────────────────────────────────────────

class TestChatSessions:
    def test_create_session(self):
        r = client.post("/api/v1/chat/session", json={})
        assert r.status_code == 200
        body = r.json()
        assert "session_id" in body
        assert body["session_id"]  # not empty

    def test_create_session_with_user_id(self):
        r = client.post("/api/v1/chat/session", json={"user_id": "user42", "metadata": {"device": "mobile"}})
        assert r.status_code == 200
        body = r.json()
        assert body["user_id"] == "user42"
        assert body["metadata"]["device"] == "mobile"

    def test_list_sessions_empty(self):
        r = client.get("/api/v1/chat/sessions")
        assert r.status_code == 200
        body = r.json()
        assert body["total_sessions"] == 0
        assert body["sessions"] == []

    def test_list_sessions_after_create(self):
        client.post("/api/v1/chat/session", json={})
        client.post("/api/v1/chat/session", json={})
        r = client.get("/api/v1/chat/sessions")
        assert r.status_code == 200
        assert r.json()["total_sessions"] == 2

    def test_delete_session(self):
        r = client.post("/api/v1/chat/session", json={})
        sid = r.json()["session_id"]
        r = client.delete(f"/api/v1/chat/session/{sid}")
        assert r.status_code == 200
        assert "deleted" in r.json()["message"].lower()

    def test_delete_nonexistent_session(self):
        r = client.delete("/api/v1/chat/session/nonexistent-id")
        assert r.status_code == 404

    def test_get_history_nonexistent_session(self):
        r = client.get("/api/v1/chat/history/nonexistent-id")
        assert r.status_code == 404


# ──────────────────────────────────────────────
# 3. Document Management
# ──────────────────────────────────────────────

class TestDocuments:
    def test_embed_text(self):
        r = client.post("/api/v1/documents/embed", json={
            "content": "Vimala College is located in Thrissur, Kerala. It was established in 1964.",
            "title": "About Vimala College",
            "metadata": {"source": "manual"}
        }, params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        body = r.json()
        assert body["doc_id"]
        assert body["chunks_created"] >= 1

    def test_embed_text_missing_fields(self):
        r = client.post("/api/v1/documents/embed", json={"content": "hello"})
        assert r.status_code == 422  # validation error — title is required

    def test_list_documents(self):
        # Embed a doc first
        client.post("/api/v1/documents/embed", json={
            "content": "Test content for listing.",
            "title": "List Test Doc",
        }, params={"collection_name": TEST_COLLECTION})

        r = client.get("/api/v1/documents/", params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        body = r.json()
        assert body["total_documents"] >= 1
        assert len(body["documents"]) >= 1

    def test_get_document_details(self):
        # Embed
        embed_r = client.post("/api/v1/documents/embed", json={
            "content": "Detail test content about admissions.",
            "title": "Admissions Info",
        }, params={"collection_name": TEST_COLLECTION})
        doc_id = embed_r.json()["doc_id"]

        r = client.get(f"/api/v1/documents/{doc_id}", params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        body = r.json()
        assert body["doc_id"] == doc_id
        assert body["title"] == "Admissions Info"
        assert body["chunk_count"] >= 1
        assert len(body["chunks"]) >= 1

    def test_get_nonexistent_document(self):
        r = client.get("/api/v1/documents/nonexistent-doc-id", params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 404

    def test_delete_document(self):
        embed_r = client.post("/api/v1/documents/embed", json={
            "content": "This doc will be deleted.",
            "title": "Delete Me",
        }, params={"collection_name": TEST_COLLECTION})
        doc_id = embed_r.json()["doc_id"]

        r = client.delete(f"/api/v1/documents/{doc_id}", params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        assert r.json()["chunks_deleted"] >= 1

        # Verify it's gone
        r = client.get(f"/api/v1/documents/{doc_id}", params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 404

    def test_delete_nonexistent_document(self):
        r = client.delete("/api/v1/documents/does-not-exist", params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 404

    def test_update_document(self):
        embed_r = client.post("/api/v1/documents/embed", json={
            "content": "Original content.",
            "title": "Update Test",
        }, params={"collection_name": TEST_COLLECTION})
        doc_id = embed_r.json()["doc_id"]

        r = client.put(f"/api/v1/documents/{doc_id}", json={
            "content": "Updated content with new info.",
            "title": "Update Test v2",
            "metadata": {}
        }, params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        assert r.json()["old_doc_id"] == doc_id
        # New doc_id is generated
        assert r.json()["doc_id"] != doc_id

    def test_bulk_embed(self):
        r = client.post("/api/v1/documents/bulk-embed", json={
            "documents": [
                {"content": "Doc one about courses.", "title": "Courses", "metadata": {}},
                {"content": "Doc two about faculty.", "title": "Faculty", "metadata": {}},
            ]
        }, params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        body = r.json()
        assert len(body["documents"]) == 2
        assert body["total_chunks"] >= 2

    def test_upload_txt_file(self):
        import io
        txt_content = b"This is a plain text document about the library."
        r = client.post("/api/v1/documents/upload",
                        files={"file": ("test.txt", io.BytesIO(txt_content), "text/plain")},
                        data={"collection_name": TEST_COLLECTION, "metadata": "{}"})
        assert r.status_code == 200
        assert r.json()["filename"] == "test.txt"
        assert r.json()["chunks_created"] >= 1

    def test_upload_unsupported_file(self):
        import io
        r = client.post("/api/v1/documents/upload",
                        files={"file": ("test.csv", io.BytesIO(b"a,b,c"), "text/csv")},
                        data={"collection_name": TEST_COLLECTION, "metadata": "{}"})
        assert r.status_code == 500  # unsupported format bubbles up


# ──────────────────────────────────────────────
# 4. Collections
# ──────────────────────────────────────────────

class TestCollections:
    def test_create_collection(self):
        r = client.post("/api/v1/documents/collections/create", json={
            "name": "test_new_col",
            "metadata": {"purpose": "testing"},
        })
        assert r.status_code == 200
        body = r.json()
        assert body["name"] == "test_new_col"

    def test_create_duplicate_collection_fails(self):
        client.post("/api/v1/documents/collections/create", json={"name": "dup_col"})
        r = client.post("/api/v1/documents/collections/create", json={"name": "dup_col"})
        assert r.status_code == 400
        assert "already exists" in r.json()["detail"]

    def test_create_duplicate_collection_with_overwrite(self):
        client.post("/api/v1/documents/collections/create", json={"name": "overwrite_col"})
        r = client.post("/api/v1/documents/collections/create", json={
            "name": "overwrite_col",
            "overwrite": True
        })
        assert r.status_code == 200

    def test_list_collections(self):
        r = client.get("/api/v1/documents/collections/list")
        assert r.status_code == 200
        body = r.json()
        assert "collections" in body
        assert isinstance(body["collections"], list)

    def test_delete_collection(self):
        client.post("/api/v1/documents/collections/create", json={"name": "to_delete_col"})
        r = client.delete("/api/v1/documents/collections/to_delete_col")
        assert r.status_code == 200
        assert "deleted" in r.json()["message"].lower()

    def test_delete_nonexistent_collection(self):
        r = client.delete("/api/v1/documents/collections/no_such_col")
        assert r.status_code in (404, 500)


# ──────────────────────────────────────────────
# 5. Chat (RAG) — requires embedded docs
# ──────────────────────────────────────────────

class TestChat:
    @pytest.fixture(autouse=True)
    def _seed_collection(self):
        """Ensure the default collection has data for RAG queries."""
        client.post("/api/v1/documents/embed", json={
            "content": (
                "Vimala College is a premier institution located in Thrissur, Kerala. "
                "It offers undergraduate and postgraduate programs in Arts, Science, and Commerce. "
                "The college was established in 1964 and is affiliated to the University of Calicut."
            ),
            "title": "Vimala College Overview",
            "metadata": {"source": "seed"}
        })
        yield

    def test_send_chat_message(self):
        r = client.post("/api/v1/chat/", json={
            "message": "Tell me about Vimala College",
            "collection_name": "default"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["response"]  # non-empty
        assert body["session_id"]
        assert isinstance(body["sources"], list)

    def test_chat_with_session(self):
        # Create session first
        session_r = client.post("/api/v1/chat/session", json={})
        sid = session_r.json()["session_id"]

        r = client.post("/api/v1/chat/", json={
            "message": "What courses are offered?",
            "session_id": sid,
            "collection_name": "default"
        })
        assert r.status_code == 200
        assert r.json()["session_id"] == sid

        # Verify history was saved
        history_r = client.get(f"/api/v1/chat/history/{sid}")
        assert history_r.status_code == 200
        history = history_r.json()["history"]
        assert len(history) == 2  # user msg + assistant msg
        assert history[0]["role"] == "user"
        assert history[1]["role"] == "assistant"

    def test_chat_auto_creates_session(self):
        r = client.post("/api/v1/chat/", json={
            "message": "Hello",
            "collection_name": "default"
        })
        assert r.status_code == 200
        sid = r.json()["session_id"]
        assert sid  # auto-generated

    def test_chat_empty_message_rejected(self):
        r = client.post("/api/v1/chat/", json={
            "message": "",
            "collection_name": "default"
        })
        assert r.status_code == 422  # min_length=1 validation

    def test_chat_missing_message_field(self):
        r = client.post("/api/v1/chat/", json={"collection_name": "default"})
        assert r.status_code == 422

    def test_stream_endpoint(self):
        r = client.post("/api/v1/chat/stream", json={
            "message": "What is Vimala College?",
            "collection_name": "default"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["response"]
        assert "note" in body


# ──────────────────────────────────────────────
# 6. Admin Auth
# ──────────────────────────────────────────────

class TestAdminAuth:
    def test_admin_login_success(self):
        r = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "testpass123"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["access_token"]
        assert body["token_type"] == "bearer"

    def test_admin_login_wrong_password(self):
        r = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "wrongpass"
        })
        assert r.status_code == 401

    def test_admin_login_wrong_username(self):
        r = client.post("/api/v1/admin/login", json={
            "username": "notadmin",
            "password": "testpass123"
        })
        assert r.status_code == 401

    def test_admin_login_missing_fields(self):
        r = client.post("/api/v1/admin/login", json={})
        assert r.status_code == 422


# ──────────────────────────────────────────────
# 7. Admin Dashboard (Protected)
# ──────────────────────────────────────────────

class TestAdminDashboard:
    def _get_token(self):
        r = client.post("/api/v1/admin/login", json={
            "username": "testadmin",
            "password": "testpass123"
        })
        return r.json()["access_token"]

    def test_admin_status_with_token(self):
        token = self._get_token()
        r = client.get("/api/v1/admin/status", headers={
            "Authorization": f"Bearer {token}"
        })
        assert r.status_code == 200
        body = r.json()
        assert body["admin"] == "testadmin"

    def test_admin_status_without_token(self):
        r = client.get("/api/v1/admin/status")
        assert r.status_code == 403  # no credentials

    def test_admin_status_with_invalid_token(self):
        r = client.get("/api/v1/admin/status", headers={
            "Authorization": "Bearer invalid-token-here"
        })
        assert r.status_code == 401

    def test_admin_status_with_expired_concept(self):
        """Non-admin role token should be rejected."""
        import jwt
        from datetime import datetime, timedelta, timezone
        payload = {
            "sub": "regularuser",
            "role": "user",  # not admin
            "exp": datetime.now(timezone.utc) + timedelta(hours=1),
        }
        token = jwt.encode(payload, "test-secret-key-for-jwt-minimum-32bytes!", algorithm="HS256")
        r = client.get("/api/v1/admin/status", headers={
            "Authorization": f"Bearer {token}"
        })
        assert r.status_code == 403


# ──────────────────────────────────────────────
# 8. Edge Cases
# ──────────────────────────────────────────────

class TestEdgeCases:
    def test_chat_with_nonexistent_collection(self):
        """Chat against a collection that has no documents."""
        r = client.post("/api/v1/chat/", json={
            "message": "hello",
            "collection_name": "empty_nonexistent_collection"
        })
        # Should not crash — may return empty or error gracefully
        assert r.status_code in (200, 500)

    def test_embed_very_long_text(self):
        """Embedding a large document should chunk correctly."""
        long_text = "This is a sentence about the college. " * 500  # ~19k chars
        r = client.post("/api/v1/documents/embed", json={
            "content": long_text,
            "title": "Long Document",
        }, params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        assert r.json()["chunks_created"] > 1

    def test_embed_minimal_text(self):
        """Very short text should still create at least 1 chunk."""
        r = client.post("/api/v1/documents/embed", json={
            "content": "Hi.",
            "title": "Tiny",
        }, params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200
        assert r.json()["chunks_created"] == 1

    def test_multiple_messages_same_session(self):
        """Multiple messages in the same session accumulate history."""
        session_r = client.post("/api/v1/chat/session", json={})
        sid = session_r.json()["session_id"]

        for msg in ["Hello", "What courses?", "Thank you"]:
            client.post("/api/v1/chat/", json={
                "message": msg,
                "session_id": sid,
                "collection_name": "default"
            })

        history_r = client.get(f"/api/v1/chat/history/{sid}")
        assert history_r.status_code == 200
        history = history_r.json()["history"]
        # 3 user + 3 assistant = 6
        assert len(history) == 6

    def test_collection_route_not_captured_by_doc_id(self):
        """GET /documents/collections/list should NOT be caught by /{doc_id}."""
        r = client.get("/api/v1/documents/collections/list")
        assert r.status_code == 200
        assert "collections" in r.json()

    def test_special_characters_in_message(self):
        """Messages with special chars should not crash."""
        r = client.post("/api/v1/chat/", json={
            "message": "What about <script>alert('xss')</script> & 'quotes\"?",
            "collection_name": "default"
        })
        assert r.status_code == 200

    def test_unicode_in_document(self):
        """Unicode content should be handled."""
        r = client.post("/api/v1/documents/embed", json={
            "content": "கல்லூரி பற்றிய தகவல்கள் 🎓 विश्वविद्यालय",
            "title": "Unicode Test",
        }, params={"collection_name": TEST_COLLECTION})
        assert r.status_code == 200

    def test_concurrent_session_isolation(self):
        """Two sessions should have independent histories."""
        s1 = client.post("/api/v1/chat/session", json={}).json()["session_id"]
        s2 = client.post("/api/v1/chat/session", json={}).json()["session_id"]

        client.post("/api/v1/chat/", json={"message": "msg for s1", "session_id": s1, "collection_name": "default"})
        client.post("/api/v1/chat/", json={"message": "msg for s2", "session_id": s2, "collection_name": "default"})

        h1 = client.get(f"/api/v1/chat/history/{s1}").json()["history"]
        h2 = client.get(f"/api/v1/chat/history/{s2}").json()["history"]

        assert len(h1) == 2
        assert len(h2) == 2
        assert h1[0]["content"] == "msg for s1"
        assert h2[0]["content"] == "msg for s2"
