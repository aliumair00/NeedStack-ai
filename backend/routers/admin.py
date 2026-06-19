from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from bson import ObjectId
from datetime import datetime, timedelta

from database.connection import get_database
from middleware.auth_middleware import get_current_admin

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
async def get_admin_stats(current_user: dict = Depends(get_current_admin)):
    db = get_database()
    total_users = await db.users.count_documents({"role": "user"})
    total_devs = await db.users.count_documents({"role": "developer"})
    total_probs = await db.problems.count_documents({})
    total_clusters = await db.clusters.count_documents({})
    pending = await db.users.count_documents({"role": "developer", "status": "pending"})
    
    pipeline = [{"$group": {"_id": None, "avg_conf": {"$avg": "$confidence_score"}}}]
    cursor = db.clusters.aggregate(pipeline)
    res = await cursor.to_list(length=1)
    avg_conf = res[0]["avg_conf"] if res else 0
    
    today = datetime.utcnow() - timedelta(days=1)
    claimed_today = await db.claims.count_documents({"claimed_at": {"$gte": today}})
    
    week_ago = datetime.utcnow() - timedelta(days=7)
    solved_week = await db.claims.count_documents({"progress_status": "solved", "updated_at": {"$gte": week_ago}})
    
    return {
        "totalUsers": total_users,
        "totalDevelopers": total_devs,
        "totalProblems": total_probs,
        "totalClusters": total_clusters,
        "pendingApprovals": pending,
        "avgConfidence": int(avg_conf),
        "problemsClaimedToday": claimed_today,
        "problemsSolvedThisWeek": solved_week
    }

@router.get("/users")
async def get_admin_users(search: Optional[str] = None, status: Optional[str] = None, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    query = {"role": "user"}
    if status:
        query["status"] = status
    if search:
        query["$or"] = [
            {"full_name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
        
    cursor = db.users.find(query).sort("joined_at", -1)
    users = await cursor.to_list(length=100)
    
    result = []
    for u in users:
        result.append({
            "id": str(u["_id"]),
            "name": u["full_name"],
            "email": u["email"],
            "avatar": u["full_name"][:2].upper(),
            "problemsSubmitted": u.get("problems_submitted", 0),
            "status": u["status"],
            "joinedAt": u["joined_at"].isoformat() + "Z",
            "lastActive": u["last_active"].isoformat() + "Z"
        })
    return result

@router.get("/developers")
async def get_admin_developers(status: Optional[str] = None, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    query = {"role": "developer"}
    if status:
        query["status"] = status
        
    cursor = db.users.find(query).sort("applied_at", -1)
    devs = await cursor.to_list(length=100)
    
    result = []
    for d in devs:
        result.append({
            "id": str(d["_id"]),
            "name": d["full_name"],
            "email": d["email"],
            "avatar": d["full_name"][:2].upper(),
            "bio": d.get("bio", ""),
            "skills": d.get("skills", []),
            "problemsClaimed": d.get("problems_claimed", 0),
            "problemsSolved": d.get("problems_solved", 0),
            "status": d["status"],
            "appliedAt": d.get("applied_at", datetime.utcnow()).isoformat() + "Z",
            "approvedAt": d.get("approved_at", datetime.utcnow()).isoformat() + "Z" if d.get("approved_at") else None
        })
    return result

@router.patch("/developers/{id}/approve")
async def approve_developer(id: str, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    await db.users.update_one(
        {"_id": ObjectId(id), "role": "developer"},
        {"$set": {"status": "approved", "approved_at": datetime.utcnow()}}
    )
    # Optional: create notification
    return {"message": "Developer approved"}

@router.patch("/developers/{id}/reject")
async def reject_developer(id: str, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    await db.users.update_one(
        {"_id": ObjectId(id), "role": "developer"},
        {"$set": {"status": "rejected"}}
    )
    return {"message": "Developer rejected"}

@router.patch("/users/{id}/ban")
async def ban_user(id: str, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    user = await db.users.find_one({"_id": ObjectId(id)})
    if not user: raise HTTPException(status_code=404)
    
    new_status = "active" if user["status"] == "banned" else "banned"
    await db.users.update_one({"_id": ObjectId(id)}, {"$set": {"status": new_status}})
    return {"message": "User status updated", "status": new_status}

@router.patch("/developers/{id}/ban")
async def ban_developer(id: str, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    dev = await db.users.find_one({"_id": ObjectId(id), "role": "developer"})
    if not dev: raise HTTPException(status_code=404)
    
    new_status = "approved" if dev["status"] == "banned" else "banned"
    await db.users.update_one({"_id": ObjectId(id)}, {"$set": {"status": new_status}})
    return {"message": "Developer status updated", "status": new_status}

@router.get("/clusters")
async def get_admin_clusters(search: Optional[str] = None, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    query = {}
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
        
    cursor = db.clusters.find(query).sort("created_at", -1)
    clusters = await cursor.to_list(length=100)
    
    result = []
    for c in clusters:
        claimed_by_name = "None"
        if c.get("claimed_by"):
            dev = await db.users.find_one({"_id": c["claimed_by"]})
            if dev: claimed_by_name = dev["full_name"]
            
        result.append({
            "id": str(c["_id"]),
            "title": c["title"],
            "category": c["category"],
            "reportCount": c["report_count"],
            "confidenceScore": c["confidence_score"],
            "claimStatus": c["claim_status"],
            "claimedBy": claimed_by_name,
            "isFeatured": c.get("is_featured", False),
            "isTrending": c.get("is_trending", False),
            "createdAt": c["created_at"].isoformat() + "Z"
        })
    return result

@router.patch("/clusters/{id}/feature")
async def feature_cluster(id: str, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    cluster = await db.clusters.find_one({"_id": ObjectId(id)})
    if not cluster: raise HTTPException(status_code=404)
    
    new_feat = not cluster.get("is_featured", False)
    await db.clusters.update_one({"_id": ObjectId(id)}, {"$set": {"is_featured": new_feat}})
    return {"isFeatured": new_feat}

@router.delete("/clusters/{id}")
async def delete_cluster(id: str, current_user: dict = Depends(get_current_admin)):
    db = get_database()
    await db.clusters.delete_one({"_id": ObjectId(id)})
    return {"message": "Cluster deleted"}

@router.get("/activity")
async def get_admin_activity(current_user: dict = Depends(get_current_admin)):
    db = get_database()
    cursor = db.activity_log.find({}).sort("created_at", -1).limit(50)
    logs = await cursor.to_list(length=50)
    
    result = []
    for l in logs:
        # Time ago logic simplified for admin activity feed
        diff = datetime.utcnow() - l["created_at"]
        if diff.days > 0: time_str = f"{diff.days}d ago"
        elif diff.seconds // 3600 > 0: time_str = f"{diff.seconds // 3600}h ago"
        else: time_str = "Just now"
        
        result.append({
            "id": str(l["_id"]),
            "type": l["type"],
            "message": l["message"],
            "time": time_str,
            "avatar": l.get("actor_avatar", "AI")
        })
    return result
