from database.connection import get_database
from datetime import datetime
from bson import ObjectId

async def create_notification(user_id: str, type: str, message: str, cluster_id: str = None, problem_id: str = None):
    db = get_database()
    doc = {
        "user_id": ObjectId(user_id),
        "type": type,
        "message": message,
        "is_read": False,
        "cluster_id": ObjectId(cluster_id) if cluster_id else None,
        "problem_id": ObjectId(problem_id) if problem_id else None,
        "created_at": datetime.utcnow()
    }
    await db.notifications.insert_one(doc)

async def notify_users_in_cluster(cluster_id: str, type: str, message: str):
    db = get_database()
    cursor = db.problems.find({"cluster_id": ObjectId(cluster_id)})
    problems = await cursor.to_list(length=None)
    
    unique_users = set(str(p["user_id"]) for p in problems)
    
    for u_id in unique_users:
        await create_notification(u_id, type, message, cluster_id=cluster_id)
