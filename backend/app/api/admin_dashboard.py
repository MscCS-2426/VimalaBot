from fastapi import APIRouter, Depends
from ..core.admin import admin_required

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/status")
def admin_status(admin=Depends(admin_required)):
    return {
        "message": "Admin access granted",
        "admin": admin["sub"]
    }
