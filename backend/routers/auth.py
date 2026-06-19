from fastapi import APIRouter, HTTPException, status, Depends
from models.user import UserCreate, UserLogin, TokenResponse, UserResponse
from services.auth_service import get_password_hash, verify_password, create_access_token
from database.connection import get_database
from middleware.auth_middleware import get_current_user
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user: UserCreate):
    print(">>> [DEBUG] Register endpoint hit!")
    db = get_database()
    print(">>> [DEBUG] got database")
    
    # Validate uniqueness
    print(">>> [DEBUG] checking existing user...")
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    if user.role not in ["user", "developer"]:
        raise HTTPException(status_code=400, detail="Invalid role")
        
    print(">>> [DEBUG] hashing password...")
    # Prepare user doc
    user_doc = {
        "email": user.email,
        "password_hash": get_password_hash(user.password),
        "full_name": user.full_name,
        "role": user.role,
        "status": "pending" if user.role == "developer" else "active",
        "bio": user.bio if user.role == "developer" else None,
        "skills": user.skills[:8] if user.role == "developer" and user.skills else [],
        "problems_submitted": 0,
        "problems_claimed": 0,
        "problems_solved": 0,
        "joined_at": datetime.utcnow(),
        "last_active": datetime.utcnow()
    }
    
    if user.role == "developer":
        user_doc["applied_at"] = datetime.utcnow()
        
    print(">>> [DEBUG] inserting into db...")
    await db.users.insert_one(user_doc)
    print(">>> [DEBUG] done!")
    return {"message": "Registration successful"}

@router.post("/login", response_model=TokenResponse)
async def login(user_login: UserLogin):
    # Check for hardcoded admin from .env first
    admin_email = os.getenv("ADMIN_EMAIL")
    admin_password = os.getenv("ADMIN_PASSWORD")
    if admin_email and admin_password and user_login.email == admin_email and user_login.password == admin_password:
        token_payload = {"user_id": "admin", "role": "admin"}
        return {
            "access_token": create_access_token(subject=token_payload),
            "role": "admin",
            "email": admin_email,
            "full_name": "System Admin",
            "user_id": "admin"
        }
        
    db = get_database()
    user = await db.users.find_one({"email": user_login.email})
    
    if not user or not verify_password(user_login.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials or server connection failed."
        )
        
    if user.get("role") == "developer" and user.get("status") in ["pending", "rejected"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Developer account pending approval."
        )
        
    if user.get("status") == "banned":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is banned."
        )
        
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_active": datetime.utcnow()}})
        
    token_payload = {
        "user_id": str(user["_id"]),
        "role": user["role"]
    }
    
    access_token = create_access_token(subject=token_payload)
    
    return {
        "access_token": access_token,
        "role": user["role"],
        "email": user["email"],
        "full_name": user["full_name"],
        "user_id": str(user["_id"])
    }

@router.post("/logout")
async def logout():
    return {"message": "Logged out"}

@router.get("/me", response_model=UserResponse)
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "id": current_user["_id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "role": current_user["role"],
        "status": current_user["status"],
        "bio": current_user.get("bio"),
        "skills": current_user.get("skills", []),
        "problems_submitted": current_user.get("problems_submitted", 0),
        "problems_claimed": current_user.get("problems_claimed", 0),
        "problems_solved": current_user.get("problems_solved", 0),
        "joined_at": current_user.get("joined_at"),
        "last_active": current_user.get("last_active")
    }
