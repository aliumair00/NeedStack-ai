from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from .base import MongoBaseModel

class ClaimModel(MongoBaseModel):
    developer_id: str
    cluster_id: str
    note: Optional[str] = None
    progress_status: str # "in_progress" | "testing" | "solved"
    claimed_at: datetime
    updated_at: datetime

class ClaimProgressUpdate(BaseModel):
    status: str
    
class ClaimRequest(BaseModel):
    note: Optional[str] = None
