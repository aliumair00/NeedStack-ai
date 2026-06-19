from typing import Optional
from datetime import datetime
from .base import MongoBaseModel

class NotificationModel(MongoBaseModel):
    user_id: str
    type: str # "claim" | "similar" | "message" | "solved" | "approval"
    message: str
    is_read: bool = False
    cluster_id: Optional[str] = None
    problem_id: Optional[str] = None
    created_at: datetime
