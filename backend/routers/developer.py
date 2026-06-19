from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from bson import ObjectId
from datetime import datetime

from database.connection import get_database
from middleware.auth_middleware import get_current_developer
from models.claim import ClaimRequest, ClaimProgressUpdate
from services.notification_service import notify_users_in_cluster

router = APIRouter(prefix="/api/developer", tags=["developer"])

@router.get("/problems")
async def get_developer_problems(category: Optional[str] = "All", sort: Optional[str] = "most_reported", trending: Optional[bool] = False, search: Optional[str] = None, current_user: dict = Depends(get_current_developer)):
    db = get_database()
    query = {}
    if category and category != "All":
        query["category"] = category
    if trending:
        query["is_trending"] = True
    if search:
        query["title"] = {"$regex": search, "$options": "i"}
        
    sort_query = [("report_count", -1)]
    if sort == "trending":
        sort_query = [("weekly_growth", -1)]
    elif sort == "newest":
        sort_query = [("created_at", -1)]
        
    cursor = db.clusters.find(query).sort(sort_query).limit(100)
    clusters = await cursor.to_list(length=100)
    
    result = []
    user_id_str = str(current_user["_id"])
    
    for c in clusters:
        # Get users count
        user_count = await db.problems.count_documents({"cluster_id": c["_id"]})
        
        claimed_by_name = None
        if c.get("claimed_by"):
            dev = await db.users.find_one({"_id": c["claimed_by"]})
            if dev: claimed_by_name = dev["full_name"]
            
        result.append({
            "id": str(c["_id"]),
            "title": c["title"],
            "category": c["category"],
            "reportCount": c["report_count"],
            "confidenceScore": c["confidence_score"],
            "weeklyGrowth": int(c.get("weekly_growth", 0)),
            "isTrending": c.get("is_trending", False),
            "claimStatus": c["claim_status"],
            "claimedByMe": str(c.get("claimed_by")) == user_id_str,
            "claimedByName": claimed_by_name,
            "userCount": user_count,
            "keywords": c.get("keywords", []),
            "createdAt": c["created_at"].isoformat() + "Z"
        })
        
    return result

@router.post("/claim/{cluster_id}")
async def claim_problem(cluster_id: str, req: ClaimRequest, current_user: dict = Depends(get_current_developer)):
    db = get_database()
    cluster = await db.clusters.find_one({"_id": ObjectId(cluster_id)})
    if not cluster:
        raise HTTPException(status_code=404, detail="Cluster not found")
        
    if cluster["claim_status"] != "unclaimed" and str(cluster.get("claimed_by")) != str(current_user["_id"]):
        raise HTTPException(status_code=409, detail="Already claimed by another developer")
        
    dev_id = ObjectId(current_user["_id"])
    now = datetime.utcnow()
    
    await db.clusters.update_one(
        {"_id": ObjectId(cluster_id)},
        {
            "$set": {
                "claim_status": "in_progress",
                "claimed_by": dev_id,
                "claim_note": req.note,
                "progress_status": "in_progress",
                "updated_at": now
            }
        }
    )
    
    claim_doc = {
        "developer_id": dev_id,
        "cluster_id": ObjectId(cluster_id),
        "note": req.note,
        "progress_status": "in_progress",
        "claimed_at": now,
        "updated_at": now
    }
    res = await db.claims.insert_one(claim_doc)
    
    # Notify users & auto-initialize conversation with a system message
    dev_name = current_user["full_name"].split(" ")[0]
    await notify_users_in_cluster(cluster_id, "claim", f"Developer {dev_name} claimed your problem: {cluster['title']}")
    
    # Auto-start conversation in db by sending a welcome message
    cursor = db.problems.find({"cluster_id": ObjectId(cluster_id)})
    probs = await cursor.to_list(length=None)
    unique_users = set(str(p["user_id"]) for p in probs)
    for u_id in unique_users:
        msg = {
            "sender_id": dev_id,
            "receiver_id": ObjectId(u_id),
            "cluster_id": ObjectId(cluster_id),
            "content": f"Hi! I've claimed your problem '{cluster['title']}' and am building a solution. Let's discuss details here.",
            "is_read": False,
            "created_at": now
        }
        await db.messages.insert_one(msg)
        
    # Update developer stats
    await db.users.update_one({"_id": dev_id}, {"$inc": {"problems_claimed": 1}})
    
    return {"message": "Cluster claimed successfully", "claim_id": str(res.inserted_id)}

@router.get("/my-claims")
async def get_my_claims(current_user: dict = Depends(get_current_developer)):
    db = get_database()
    dev_id = ObjectId(current_user["_id"])
    
    cursor = db.claims.find({"developer_id": dev_id}).sort("claimed_at", -1)
    claims = await cursor.to_list(length=100)
    
    result = []
    for c in claims:
        cluster = await db.clusters.find_one({"_id": c["cluster_id"]})
        if not cluster: continue
        
        user_count = await db.problems.count_documents({"cluster_id": c["cluster_id"]})
        
        result.append({
            "claim_id": str(c["_id"]),
            "cluster_id": str(c["cluster_id"]),
            "title": cluster["title"],
            "category": cluster["category"],
            "reportCount": cluster["report_count"],
            "progressStatus": c["progress_status"],
            "userCount": user_count,
            "claimedAt": c["claimed_at"].isoformat() + "Z",
            "note": c.get("note")
        })
        
    return result

@router.patch("/claim/{claim_id}/progress")
async def update_claim_progress(claim_id: str, req: ClaimProgressUpdate, current_user: dict = Depends(get_current_developer)):
    db = get_database()
    claim = await db.claims.find_one({"_id": ObjectId(claim_id), "developer_id": ObjectId(current_user["_id"])})
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")
        
    now = datetime.utcnow()
    await db.claims.update_one(
        {"_id": ObjectId(claim_id)},
        {"$set": {"progress_status": req.status, "updated_at": now}}
    )
    
    update_data = {"progress_status": req.status, "updated_at": now}
    if req.status == "solved":
        update_data["claim_status"] = "solved"
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$inc": {"problems_solved": 1}})
        
    cluster_id = claim["cluster_id"]
    await db.clusters.update_one({"_id": cluster_id}, {"$set": update_data})
    
    if req.status == "solved":
        dev_name = current_user["full_name"].split(" ")[0]
        cluster = await db.clusters.find_one({"_id": cluster_id})
        await notify_users_in_cluster(str(cluster_id), "solved", f"Developer {dev_name} solved the problem: {cluster['title']}")
        
    return {"message": "Progress updated"}
