from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from ..core.admin import admin_required
from ..utils.logger import get_log_file_path
import csv
import os

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/status")
def admin_status(admin=Depends(admin_required)):
    return {
        "message": "Admin access granted",
        "admin": admin["sub"]
    }

@router.get("/logs/data")
def get_logs_data(admin=Depends(admin_required)):
    log_path = get_log_file_path()
    if not os.path.exists(log_path):
        return {"logs": []}
    
    logs = []
    try:
        with open(log_path, mode='r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                logs.append(row)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading logs: {str(e)}")
    
    return {"logs": logs}

@router.get("/logs/download")
def download_logs(admin=Depends(admin_required)):
    log_path = get_log_file_path()
    if not os.path.exists(log_path):
        raise HTTPException(status_code=404, detail="Log file not found")
    
    return FileResponse(
        path=log_path,
        filename=f"chat_logs_{os.path.basename(log_path)}",
        media_type="text/csv"
    )

