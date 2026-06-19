from pydantic import BaseModel
from datetime import datetime
from .base import MongoBaseModel

class MessageModel(MongoBaseModel):
    sender_id: str
    receiver_id: str
    cluster_id: str
    content: str
    is_read: bool = False
    created_at: datetime

class MessageSendRequest(BaseModel):
    receiver_id: str
    cluster_id: str
    content: str
