from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from .base import MongoBaseModel

class ProblemSubmit(BaseModel):
    text: str
    category: str

class ProblemResponse(MongoBaseModel):
    text: str
    category: str
    cluster_id: str
    user_id: str
    votes: int
    created_at: datetime

class ProblemFeedItem(BaseModel):
    id: str
    category: str
    categoryClass: str
    timestamp: str
    problemText: str
    votes: int
    similarReportsCount: int
    clusterId: str

class MyProblemItem(BaseModel):
    id: str
    text: str
    category: str
    categoryClass: str
    similarCount: int
    claimStatus: str
    claimedBy: Optional[dict] = None
    createdAt: str
    hasUnreadMessage: bool
    clusterId: str

class ValidateRequest(BaseModel):
    text: str

class ValidationCluster(BaseModel):
    id: str
    title: str
    reportCount: int
    similarityPercent: int

class ValidationResponse(BaseModel):
    category: str
    confidence: int
    verdict: str
    totalSimilarReports: int
    totalClusters: int
    clusters: List[ValidationCluster]
