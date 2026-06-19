from typing import List, Optional
from datetime import datetime
from .base import MongoBaseModel

class ClusterModel(MongoBaseModel):
    title: str
    category: str
    centroid_embedding: List[float]
    report_count: int
    confidence_score: float
    claim_status: str # "unclaimed" | "in_progress" | "solved"
    claimed_by: Optional[str] = None
    claim_note: Optional[str] = None
    progress_status: Optional[str] = None # "in_progress" | "testing" | "solved"
    is_featured: bool = False
    is_trending: bool = False
    weekly_growth: float = 0.0
    keywords: List[str] = []
    created_at: datetime
    updated_at: datetime
