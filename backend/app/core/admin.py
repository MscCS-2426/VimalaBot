from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer
import jwt
from jwt.exceptions import PyJWTError
from .config import settings

security = HTTPBearer()
ALGORITHM = "HS256"

def admin_required(token=Depends(security)):
    try:
        payload = jwt.decode(
            token.credentials,
            settings.ADMIN_SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        if payload.get("role") != "admin":
            raise HTTPException(status_code=403, detail="Not an admin")

        return payload

    except PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
