from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal
from datetime import datetime
from .base import MongoBaseModel
from utils.validators import SafeStr

class ClaimModel(MongoBaseModel):
    developer_id: str
    cluster_id: str
    note: Optional[str] = None
    progress_status: str                                       
    claimed_at: datetime
    updated_at: datetime

class ClaimProgressUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    status: Literal["in_progress", "testing", "solved"]
    
class ClaimRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    note: Optional[SafeStr] = Field(default=None, max_length=300)
