from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime
from .base import MongoBaseModel

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: str # "user" | "developer"
    bio: Optional[str] = None
    skills: Optional[List[str]] = []

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(MongoBaseModel):
    email: EmailStr
    full_name: str
    role: str
    status: str
    bio: Optional[str] = None
    skills: Optional[List[str]] = []
    problems_submitted: int = 0
    problems_claimed: int = 0
    problems_solved: int = 0
    joined_at: datetime
    last_active: datetime

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    email: str
    full_name: str
    user_id: str
