from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from typing import Optional
from bson import ObjectId

from database.connection import get_database
from middleware.auth_middleware import get_current_user
from utils.validators import SafeStr

router = APIRouter(prefix="/api", tags=["settings"])

class SettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    full_name: Optional[SafeStr] = Field(default=None, min_length=2, max_length=50, pattern=r"^[A-Za-z\s\-\.]+$")
    email: Optional[EmailStr] = None
    notifications: Optional[bool] = None

@router.get("/settings", response_model=dict)
async def get_settings(current_user: dict = Depends(get_current_user)):
   
    return {
        "full_name": current_user.get("full_name"),
        "email": current_user.get("email"),
        "notifications": current_user.get("notifications", False),
    }

@router.patch("/settings", response_model=dict)
async def update_settings(update: SettingsUpdate, current_user: dict = Depends(get_current_user)):
    db = get_database()
    update_data = {k: v for k, v in update.model_dump().items() if v is not None}
    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": update_data})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found or no changes applied")
                               
    return {"updated": True, **update_data}
