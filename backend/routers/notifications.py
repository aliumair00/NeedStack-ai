from fastapi import APIRouter, Depends
from bson import ObjectId

from database.connection import get_database
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

def format_time(dt) -> str:
    from datetime import datetime
    diff = datetime.utcnow() - dt
    if diff.days > 0: return f"{diff.days}d ago"
    if diff.seconds // 3600 > 0: return f"{diff.seconds // 3600}h ago"
    if diff.seconds // 60 > 0: return f"{diff.seconds // 60}m ago"
    return "Just now"

@router.get("")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.notifications.find({"user_id": ObjectId(current_user["_id"])}).sort("created_at", -1).limit(20)
    notifs = await cursor.to_list(length=20)
    
    result = []
    for n in notifs:
        result.append({
            "id": str(n["_id"]),
            "type": n["type"],
            "message": n["message"],
            "time": format_time(n["created_at"]),
            "is_read": n["is_read"],
            "problem_id": str(n.get("problem_id")) if n.get("problem_id") else None,
            "cluster_id": str(n.get("cluster_id")) if n.get("cluster_id") else None
        })
    return result

@router.patch("/read-all")
async def mark_all_read(current_user: dict = Depends(get_current_user)):
    db = get_database()
    res = await db.notifications.update_many(
        {"user_id": ObjectId(current_user["_id"]), "is_read": False},
        {"$set": {"is_read": True}}
    )
    return {"updated": res.modified_count}
