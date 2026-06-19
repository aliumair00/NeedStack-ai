from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from bson import ObjectId

from database.connection import get_database
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api", tags=["settings"])

class SettingsUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    notifications: Optional[bool] = None

@router.get("/settings", response_model=dict)
async def get_settings(current_user: dict = Depends(get_current_user)):
    # Return a subset of user fields
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
    # Return the updated fields
    return {"updated": True, **update_data}
