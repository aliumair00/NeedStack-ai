import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from pydantic import BaseModel
from typing import Optional
from database.connection import get_database
from bson import ObjectId

SECRET_KEY = os.getenv("JWT_SECRET", "default-secret-key")
ALGORITHM = "HS256"

security = HTTPBearer()

class TokenData(BaseModel):
    user_id: Optional[str] = None
    role: Optional[str] = None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        role: str = payload.get("role")
        if user_id is None:
            raise credentials_exception
        token_data = TokenData(user_id=user_id, role=role)
    except JWTError:
        raise credentials_exception
        
    if token_data.role == "admin":
        return {
            "_id": "admin",
            "role": "admin",
            "email": os.getenv("ADMIN_EMAIL"),
            "full_name": "System Admin",
            "status": "active"
        }
        
    db = get_database()
    try:
        user = await db.users.find_one({"_id": ObjectId(token_data.user_id)})
    except Exception:
        raise credentials_exception
        
    if user is None:
        raise credentials_exception
        
    user["_id"] = str(user["_id"])
    return user

async def get_current_developer(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "developer":
        raise HTTPException(status_code=403, detail="Not authorized. Developer role required.")
    if current_user.get("status") in ["pending", "rejected", "banned"]:
        raise HTTPException(status_code=403, detail=f"Developer account {current_user.get('status')}.")
    return current_user

async def get_current_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized. Admin role required.")
    return current_user
