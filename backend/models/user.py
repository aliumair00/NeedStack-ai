from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import List, Optional, Literal
from datetime import datetime
from .base import MongoBaseModel
from utils.validators import SafeStr

class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    full_name: SafeStr = Field(min_length=2, max_length=50, pattern=r"^[A-Za-z\s\-\.]+$")
    role: Literal["user", "developer"]
    bio: Optional[SafeStr] = Field(default=None, max_length=500)
    skills: Optional[List[SafeStr]] = Field(default=[], max_items=20)

class UserLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    email: EmailStr
    password: str = Field(min_length=1, max_length=100)

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
