from fastapi import APIRouter, Depends, HTTPException, Response
from typing import List
from bson import ObjectId
from datetime import datetime

from database.connection import get_database
from middleware.auth_middleware import get_current_user
from models.message import MessageSendRequest
from services.notification_service import create_notification

router = APIRouter(prefix="/api/messages", tags=["messages"])

def format_time(dt: datetime) -> str:
    diff = datetime.utcnow() - dt
    if diff.days > 0:
        return f"{diff.days}d ago"
    elif diff.seconds // 3600 > 0:
        return f"{diff.seconds // 3600}h ago"
    elif diff.seconds // 60 > 0:
        return f"{diff.seconds // 60}m ago"
    return "Just now"

@router.get("/conversations")
async def get_conversations(current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = ObjectId(current_user["_id"])
    
    pipeline = [
        {
            "$match": {
                "$or": [{"sender_id": user_id}, {"receiver_id": user_id}]
            }
        },
        {
            "$sort": {"created_at": -1}
        },
        {
            "$group": {
                "_id": {
                    "cluster_id": "$cluster_id",
                    "other_user": {
                        "$cond": [{"$eq": ["$sender_id", user_id]}, "$receiver_id", "$sender_id"]
                    }
                },
                "last_message": {"$first": "$content"},
                "last_time": {"$first": "$created_at"},
                "unread_count": {
                    "$sum": {
                        "$cond": [
                            {"$and": [
                                {"$eq": ["$receiver_id", user_id]},
                                {"$eq": ["$is_read", False]}
                            ]}, 1, 0
                        ]
                    }
                }
            }
        }
    ]
    
    cursor = db.messages.aggregate(pipeline)
    conversations = await cursor.to_list(length=100)
    
    result = []
    for conv in conversations:
        other_user_id = conv["_id"]["other_user"]
        cluster_id = conv["_id"]["cluster_id"]
        
        other_user = await db.users.find_one({"_id": other_user_id})
        cluster = await db.clusters.find_one({"_id": cluster_id})
        
        if not other_user or not cluster: continue
            
        result.append({
            "conversation_id": f"{cluster_id}_{other_user_id}",
            "cluster_id": str(cluster_id),
            "other_user_id": str(other_user_id),
            "other_user_name": other_user["full_name"],
            "other_user_avatar": other_user["full_name"][:2].upper(),
            "problem_title": cluster["title"],
            "last_message": conv["last_message"],
            "last_time": format_time(conv["last_time"]),
            "unread_count": conv["unread_count"]
        })
        
    result.sort(key=lambda x: conv["last_time"], reverse=True)
    return result

@router.get("/{cluster_id}/{other_user_id}")
async def get_messages(cluster_id: str, other_user_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    user_id = ObjectId(current_user["_id"])
    # If other_user_id is "temp", this is a temporary conversation, return empty list
    if other_user_id == "temp":
        # Validate cluster_id is a proper ObjectId
        try:
            ObjectId(cluster_id)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid conversation ID")
        return []
    other_id = ObjectId(other_user_id)
    c_id = ObjectId(cluster_id)
    # Mark read
    await db.messages.update_many(
        {
            "cluster_id": c_id,
            "sender_id": other_id,
            "receiver_id": user_id,
            "is_read": False
        },
        {"$set": {"is_read": True}}
    )
    
    cursor = db.messages.find({
        "cluster_id": c_id,
        "$or": [
            {"sender_id": user_id, "receiver_id": other_id},
            {"sender_id": other_id, "receiver_id": user_id}
        ]
    }).sort("created_at", 1)
    
    messages = await cursor.to_list(length=1000)
    
    result = []
    # Handle temporary conversation where other_user_id might be 'temp'
    if other_user_id == "temp":
        # Return empty list for temporary conversations
        return []
    for m in messages:
        is_me = m["sender_id"] == user_id
        result.append({
            "id": str(m["_id"]),
            "sender_id": str(m["sender_id"]),
            "content": m["content"],
            "time": m["created_at"].strftime("%I:%M %p"),
            "is_me": is_me
        })
    return result

@router.options("", include_in_schema=False)
async def options_messages():
    return Response(status_code=204)

@router.post("")
async def send_message(req: MessageSendRequest, current_user: dict = Depends(get_current_user)):
    """Create a new message in a conversation."""
    db = get_database()
    user_id = ObjectId(current_user["_id"])
    receiver_id = ObjectId(req.receiver_id)
    cluster_id = ObjectId(req.cluster_id)
    
    msg = {
        "sender_id": user_id,
        "receiver_id": receiver_id,
        "cluster_id": cluster_id,
        "content": req.content,
        "is_read": False,
        "created_at": datetime.utcnow()
    }
    
    res = await db.messages.insert_one(msg)
    
    # Notify
    sender_name = current_user["full_name"].split(" ")[0]
    await create_notification(str(receiver_id), "message", f"{sender_name} sent you a message", str(cluster_id))
    
    return {
        "id": str(res.inserted_id),
        "content": req.content,
        "time": "Just now",
        "is_me": True
    }

@router.patch("/read/{cluster_id}/{other_user_id}")
async def read_messages(cluster_id: str, other_user_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    res = await db.messages.update_many(
        {
            "cluster_id": ObjectId(cluster_id),
            "sender_id": ObjectId(other_user_id),
            "receiver_id": ObjectId(current_user["_id"]),
            "is_read": False
        },
        {"$set": {"is_read": True}}
    )
    return {"updated": res.modified_count}
