from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from .base import MongoBaseModel
from utils.validators import SafeStr

class MessageModel(MongoBaseModel):
    sender_id: str
    receiver_id: str
    cluster_id: str
    content: str
    is_read: bool = False
    created_at: datetime

class MessageSendRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    
    receiver_id: str
    cluster_id: str
    content: SafeStr = Field(min_length=1, max_length=1000)
