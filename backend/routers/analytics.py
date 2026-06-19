from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from typing import List

from database.connection import get_database
from middleware.auth_middleware import get_current_user

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

@router.get("/stats")
async def get_stats(range: str = "7d", current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Calculate date filter
    days = 7 if range == "7d" else (30 if range == "30d" else 90)
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    date_filter = {"created_at": {"$gte": cutoff_date}}
    
    total_problems = await db.problems.count_documents(date_filter)
    
    cluster_filter = {"claim_status": {"$ne": "solved"}, "created_at": {"$gte": cutoff_date}}
    active_clusters = await db.clusters.count_documents(cluster_filter)
    
    # Calculate avg confidence
    pipeline = [
        {"$match": date_filter},
        {"$group": {"_id": None, "avg_conf": {"$avg": "$confidence_score"}}}
    ]
    cursor = db.clusters.aggregate(pipeline)
    res = await cursor.to_list(length=1)
    avg_conf = res[0]["avg_conf"] if res else 0
    
    trending = await db.clusters.count_documents({"is_trending": True, "created_at": {"$gte": cutoff_date}})
    today_cutoff = datetime.utcnow() - timedelta(days=1)
    reports_today = await db.problems.count_documents({"created_at": {"$gte": today_cutoff}})
    solved_week = await db.claims.count_documents({"progress_status": "solved", "updated_at": {"$gte": cutoff_date}})
    
    return {
        "totalProblems": f"{total_problems:,}",
        "activeClusters": f"{active_clusters:,}",
        "avgConfidence": f"{int(avg_conf)}%",
        "trendingCategories": str(trending),
        "reportsToday": f"{reports_today:,}",
        "solvedThisWeek": f"{solved_week:,}"
    }

@router.get("/categories")
async def get_categories(range: str = "7d", current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    days = 7 if range == "7d" else (30 if range == "30d" else 90)
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    pipeline = [
        {"$match": {"created_at": {"$gte": cutoff_date}}},
        {"$group": {"_id": "$category", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}}
    ]
    cursor = db.problems.aggregate(pipeline)
    results = await cursor.to_list(length=None)
    
    total = sum(r["count"] for r in results)
    
    response = []
    for r in results:
        pct = int((r["count"] / total) * 100) if total > 0 else 0
        response.append({
            "name": r["_id"],
            "percent": pct,
            "count": r["count"]
        })
        
    return response

@router.get("/weekly-trends")
async def get_weekly_trends(range: str = "7d", current_user: dict = Depends(get_current_user)):
    # Return different mocked data based on time range to show interactivity
    if range == "30d":
        return [
            { "day": "Week 1", "healthcare": 85, "technology": 140, "business": 60 },
            { "day": "Week 2", "healthcare": 110, "technology": 120, "business": 80 },
            { "day": "Week 3", "healthcare": 95, "technology": 160, "business": 75 },
            { "day": "Week 4", "healthcare": 130, "technology": 180, "business": 90 },
        ]
    elif range == "90d":
        return [
            { "day": "Month 1", "healthcare": 300, "technology": 500, "business": 250 },
            { "day": "Month 2", "healthcare": 450, "technology": 620, "business": 340 },
            { "day": "Month 3", "healthcare": 520, "technology": 800, "business": 410 },
        ]
        
    return [
        { "day": "Mon", "healthcare": 23, "technology": 41, "business": 18 },
        { "day": "Tue", "healthcare": 31, "technology": 38, "business": 22 },
        { "day": "Wed", "healthcare": 28, "technology": 45, "business": 20 },
        { "day": "Thu", "healthcare": 35, "technology": 42, "business": 25 },
        { "day": "Fri", "healthcare": 32, "technology": 50, "business": 28 },
        { "day": "Sat", "healthcare": 20, "technology": 30, "business": 15 },
        { "day": "Sun", "healthcare": 18, "technology": 28, "business": 12 },
    ]

@router.get("/cluster-map")
async def get_cluster_map(current_user: dict = Depends(get_current_user)):
    db = get_database()
    
    # Ideally we run t-SNE here. For now, we mock the 2D layout.
    cursor = db.clusters.find({}).sort("report_count", -1).limit(30)
    clusters = await cursor.to_list(length=30)
    
    import random
    
    response = []
    for c in clusters:
        # random positions for demo
        top = f"{random.randint(10, 90)}%"
        left = f"{random.randint(10, 90)}%"
        
        rc = c["report_count"]
        if rc < 20: size = "w-4 h-4"
        elif rc < 50: size = "w-6 h-6"
        elif rc < 100: size = "w-8 h-8"
        else: size = "w-12 h-12"
        
        response.append({
            "id": str(c["_id"]),
            "top": top,
            "left": left,
            "size": size,
            "label": c["title"],
            "category": c["category"],
            "reportCount": rc
        })
        
    return response

from fastapi.responses import StreamingResponse
import io
import csv

@router.get("/export")
async def export_clusters():
    db = get_database()
    cursor = db.clusters.find({})
    clusters = await cursor.to_list(length=None)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["id", "title", "category", "reportCount", "confidenceScore", "claimStatus", "isTrending", "createdAt"])
    
    for c in clusters:
        writer.writerow([
            str(c["_id"]), c["title"], c["category"], c["report_count"],
            c["confidence_score"], c["claim_status"], c["is_trending"],
            c["created_at"].isoformat()
        ])
        
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=needstack_clusters.csv"}
    )
