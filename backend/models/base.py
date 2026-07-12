from pydantic import BaseModel, ConfigDict, Field
from pydantic.functional_validators import BeforeValidator
from typing import Annotated, Any

                                               
                                                                                      
PyObjectId = Annotated[str, BeforeValidator(str)]

class MongoBaseModel(BaseModel):
    id: PyObjectId = Field(alias="_id", default=None)
    
    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
    )
