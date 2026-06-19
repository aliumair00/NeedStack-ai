from fastapi import APIRouter, HTTPException, Depends
from typing import List, Optional
from datetime import datetime, timedelta
from bson import ObjectId

from database.connection import get_database
from middleware.auth_middleware import get_current_user
from models.problem import ProblemSubmit, ValidateRequest
from services.ai_service import encode_text, calculate_similarity, update_centroid

router = APIRouter(prefix="/api/problems", tags=["problems"])

CATEGORY_STYLE_MAP = {
    "Technology": "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    "Healthcare": "bg-cyan-500/10 text-cyan-400 border-cyan-500/25",
    "Education": "bg-purple-500/10 text-purple-400 border-purple-500/25",
    "Business": "bg-amber-500/10 text-amber-400 border-amber-500/25",
    "Social": "bg-emerald-500/10 text-emerald-400 border-emerald-500/25",
    "Other": "bg-slate-500/10 text-slate-400 border-slate-500/25"
}

def get_time_ago(dt: datetime) -> str:
    diff = datetime.utcnow() - dt
    if diff.days > 0:
        return f"{diff.days}d ago"
    hours = diff.seconds // 3600
    if hours > 0:
        return f"{hours}h ago"
    minutes = diff.seconds // 60
    if minutes > 0:
        return f"{minutes}m ago"
    return "Just now"

@router.post("/submit", status_code=201)
async def submit_problem(problem: ProblemSubmit, current_user: dict = Depends(get_current_user)):
    db = get_database()
    embedding = encode_text(problem.text)
    
    # Find matching clusters in the same category
    cursor = db.clusters.find({"category": problem.category})
    clusters = await cursor.to_list(length=100)
    
    best_match = None
    best_sim = 0.0
    
    for cluster in clusters:
        sim = calculate_similarity(embedding, cluster["centroid_embedding"])
        if sim > 0.75 and sim > best_sim:
            best_match = cluster
            best_sim = sim
            
    is_new_cluster = False
    cluster_id = None
    similar_reports_count = 0
    
    if best_match:
        # Update existing cluster
        cluster_id = best_match["_id"]
        new_centroid = update_centroid(best_match["centroid_embedding"], best_match["report_count"], embedding)
        similar_reports_count = best_match["report_count"] # before increment
        
        await db.clusters.update_one(
            {"_id": cluster_id},
            {
                "$set": {
                    "centroid_embedding": new_centroid,
                    "updated_at": datetime.utcnow()
                },
                "$inc": {"report_count": 1}
            }
        )
    else:
        # Create new cluster
        is_new_cluster = True
        new_cluster = {
            "title": problem.text[:60], # naive title generation for now
            "category": problem.category,
            "centroid_embedding": embedding,
            "report_count": 1,
            "confidence_score": 50.0, # default starting confidence
            "claim_status": "unclaimed",
            "claimed_by": None,
            "claim_note": None,
            "progress_status": None,
            "is_featured": False,
            "is_trending": False,
            "weekly_growth": 0.0,
            "keywords": [],
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        result = await db.clusters.insert_one(new_cluster)
        cluster_id = result.inserted_id
        similar_reports_count = 0

    # Save problem
    new_problem = {
        "text": problem.text,
        "category": problem.category,
        "embedding": embedding,
        "cluster_id": cluster_id,
        "user_id": ObjectId(current_user["_id"]),
        "votes": 0,
        "upvoted_by": [],
        "created_at": datetime.utcnow()
    }
    await db.problems.insert_one(new_problem)
    
    # Update user stats
    await db.users.update_one(
        {"_id": ObjectId(current_user["_id"])},
        {"$inc": {"problems_submitted": 1}}
    )
    
    return {
        "similarReportsCount": similar_reports_count,
        "clusterId": str(cluster_id),
        "isNewCluster": is_new_cluster
    }

@router.get("/user-feed")
async def get_user_feed(category: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_database()
    query = {}
    if category and category != "All":
        query["category"] = category
        
    cursor = db.problems.find(query).sort("votes", -1).limit(50)
    problems = await cursor.to_list(length=50)
    
    feed = []
    for p in problems:
        cluster = await db.clusters.find_one({"_id": p["cluster_id"]})
        similar_count = cluster["report_count"] if cluster else 0
        
        feed.append({
            "id": str(p["_id"]),
            "category": p["category"],
            "categoryClass": CATEGORY_STYLE_MAP.get(p["category"], CATEGORY_STYLE_MAP["Other"]),
            "timestamp": get_time_ago(p["created_at"]),
            "problemText": p["text"],
            "votes": p.get("votes", 0),
            "similarReportsCount": similar_count,
            "clusterId": str(p["cluster_id"])
        })
        
    return feed

@router.post("/upvote/{problem_id}")
async def upvote_problem(problem_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    problem = await db.problems.find_one({"_id": ObjectId(problem_id)})
    if not problem:
        raise HTTPException(status_code=404, detail="Problem not found")
        
    user_id = ObjectId(current_user["_id"])
    if user_id in problem.get("upvoted_by", []):
        # Already voted
        return {"votes": problem.get("votes", 0)}
        
    result = await db.problems.find_one_and_update(
        {"_id": ObjectId(problem_id)},
        {
            "$inc": {"votes": 1},
            "$push": {"upvoted_by": user_id}
        },
        return_document=True
    )
    
    return {"votes": result["votes"]}

@router.get("/my-problems")
async def get_my_problems(current_user: dict = Depends(get_current_user)):
    db = get_database()
    cursor = db.problems.find({"user_id": ObjectId(current_user["_id"])}).sort("created_at", -1)
    problems = await cursor.to_list(length=100)
    
    result = []
    for p in problems:
        cluster = await db.clusters.find_one({"_id": p["cluster_id"]})
        if not cluster:
            continue
            
        claimed_by_info = None
        if cluster.get("claimed_by"):
            dev = await db.users.find_one({"_id": cluster["claimed_by"]})
            if dev:
                claimed_by_info = {
                    "id": str(dev["_id"]),
                    "name": dev["full_name"],
                    "avatar": dev["full_name"][:2].upper()
                }
                
        # Check unread messages
        has_unread = False
        unread_msg = await db.messages.find_one({
            "cluster_id": cluster["_id"],
            "receiver_id": ObjectId(current_user["_id"]),
            "is_read": False
        })
        if unread_msg:
            has_unread = True
            
        result.append({
            "id": str(p["_id"]),
            "text": p["text"],
            "category": p["category"],
            "categoryClass": CATEGORY_STYLE_MAP.get(p["category"], CATEGORY_STYLE_MAP["Other"]),
            "similarCount": cluster["report_count"],
            "claimStatus": cluster["claim_status"],
            "claimedBy": claimed_by_info,
            "createdAt": p["created_at"].isoformat() + "Z",
            "hasUnreadMessage": has_unread,
            "clusterId": str(cluster["_id"])
        })
        
    return result

@router.post("/validate")
async def validate_idea(req: ValidateRequest):
    db = get_database()
    embedding = encode_text(req.text)
    
    cursor = db.clusters.find({})
    all_clusters = await cursor.to_list(length=None)
    
    matches = []
    for c in all_clusters:
        sim = calculate_similarity(embedding, c["centroid_embedding"])
        matches.append({
            "cluster": c,
            "similarity": sim
        })
        
    matches.sort(key=lambda x: x["similarity"], reverse=True)
    top_matches = matches[:5]
    
    if not top_matches:
        return {
            "category": "Other",
            "confidence": 0,
            "verdict": "niche",
            "totalSimilarReports": 0,
            "totalClusters": 0,
            "clusters": []
        }
        
    highest_sim = top_matches[0]["similarity"]
    best_category = top_matches[0]["cluster"]["category"]
    
    response_clusters = []
    total_similar = 0
    
    for m in top_matches:
        c = m["cluster"]
        sim_pct = int(m["similarity"] * 100)
        # Only include if somewhat similar
        if sim_pct > 30:
            response_clusters.append({
                "id": str(c["_id"]),
                "title": c["title"],
                "reportCount": c["report_count"],
                "similarityPercent": sim_pct
            })
            total_similar += c["report_count"]
            
    if total_similar >= 50:
        verdict = "real"
    elif total_similar >= 10:
        verdict = "weak"
    else:
        verdict = "niche"
        
    return {
        "category": best_category,
        "confidence": int(highest_sim * 100),
        "verdict": verdict,
        "totalSimilarReports": total_similar,
        "totalClusters": len(response_clusters),
        "clusters": response_clusters
    }
