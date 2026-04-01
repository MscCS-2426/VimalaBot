from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import jwt
from ..core.config import settings

router = APIRouter(
    prefix="/admin",
    tags=["Admin Auth"]
)

ALGORITHM = "HS256"

class AdminLoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/login", response_model=TokenResponse)
def admin_login(data: AdminLoginRequest):
    if (
        data.username != settings.ADMIN_USERNAME
        or data.password != settings.ADMIN_PASSWORD
    ):
        raise HTTPException(status_code=401, detail="Invalid admin credentials")

    payload = {
        "sub": data.username,
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=2),
    }

    token = jwt.encode(
        payload,
        settings.ADMIN_SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return {"access_token": token}
