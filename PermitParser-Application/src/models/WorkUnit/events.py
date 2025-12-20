
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict

from .enums import ContentType


class WorkUnitCreatedEvent(BaseModel):
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        use_enum_values=True,
        validate_assignment=True,
    )
    
    documentId: str = Field(
        ...,
        description="ID of the document being processed"
    )
    projectId: str = Field(
        ...,
        description="ID of the construction project (for context and traceability)"
    )
    workUnitId: str = Field(
        ...,
        description="ID of the newly created WorkUnit"
    )
    contentType: ContentType = Field(
        ...,
        description="Type of content in the WorkUnit (TEXT, TABLE, IMAGE)"
    )
    municipality: str = Field(
        ...,
        description="Municipality where the document originated"
    )
    timestamp: Optional[datetime] = Field(
        default_factory=datetime.utcnow,
        description="When the event was created"
    )
    
    def __str__(self) -> str:
        return f"WorkUnitCreatedEvent(workUnitId={self.workUnitId}, contentType={self.contentType})"
    
    def __repr__(self) -> str:
        return (
            f"WorkUnitCreatedEvent("
            f"documentId={self.documentId}, "
            f"projectId={self.projectId}, "
            f"workUnitId={self.workUnitId}, "
            f"contentType={self.contentType}, "
            f"municipality={self.municipality}"
            f")"
        )
    
    def to_pubsub_dict(self) -> dict:
        """Convert the event to a dictionary suitable for Pub/Sub publishing."""
        data = {
            'documentId': self.documentId,
            'projectId': self.projectId,
            'workUnitId': self.workUnitId,
            'contentType': self.contentType.value,
            'municipality': self.municipality,
        }
        
        if self.timestamp:
            data['timestamp'] = self.timestamp.isoformat()
        
        return data
    
    @classmethod
    def from_pubsub_dict(cls, data: dict) -> "WorkUnitCreatedEvent":
        """Create a WorkUnitCreatedEvent instance from Pub/Sub message data."""
        # Convert ISO string back to datetime if present
        if 'timestamp' in data and isinstance(data['timestamp'], str):
            data['timestamp'] = datetime.fromisoformat(data['timestamp'].replace('Z', '+00:00'))
            
        return cls(**data)
