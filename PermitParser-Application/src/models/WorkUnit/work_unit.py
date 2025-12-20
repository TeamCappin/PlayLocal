
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, ConfigDict

from .enums import ContentType, Status


class WorkUnit(BaseModel):
    """
    Represents a single unit of work in the document processing pipeline.
    This model maps to a Firestore document and includes references to the raw
    content stored in Google Cloud Storage.
    
    Attributes:
        id: Unique identifier for the work unit
        documentId: ID of the parent RawDocument this work unit belongs to
        projectId: ID of the construction project (for context and traceability)
        structureNodeId: ID of the StructureNode this work unit represents
        contentType: Type of content (TEXT, TABLE, IMAGE)
        rawContentGcsUri: GCS URI where the raw content chunk is stored
        parsedObjectGcsUri: GCS URI where the parsed result will be stored (optional)
        processingStatus: Current status of processing this work unit
        municipality: Municipality where this document originated
    """
    
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        use_enum_values=True,
        validate_assignment=True,
    )
    
    id: UUID = Field(
        default_factory=uuid4,
        description="Unique identifier for the work unit"
    )
    documentId: str = Field(
        ...,
        description="ID of the parent RawDocument this work unit belongs to"
    )
    projectId: str = Field(
        ...,
        description="ID of the construction project (for context and traceability)"
    )
    structureNodeId: str = Field(
        ...,
        description="ID of the StructureNode this work unit represents"
    )
    contentType: ContentType = Field(
        ...,
        description="Type of content (TEXT, TABLE, IMAGE)"
    )
    rawContentGcsUri: str = Field(
        ...,
        description="GCS URI where the raw content chunk is stored"
    )
    parsedObjectGcsUri: Optional[str] = Field(
        None,
        description="GCS URI where the parsed result will be stored"
    )
    processingStatus: Status = Field(
        default=Status.PENDING,
        description="Current status of processing this work unit"
    )
    municipality: str = Field(
        ...,
        description="Municipality where this document originated"
    )
    
    def __str__(self) -> str:
        return f"WorkUnit(id={self.id}, contentType={self.contentType}, processingStatus={self.processingStatus})"
    
    def __repr__(self) -> str:
        return (
            f"WorkUnit("
            f"id={self.id}, "
            f"documentId={self.documentId}, "
            f"projectId={self.projectId}, "
            f"structureNodeId={self.structureNodeId}, "
            f"contentType={self.contentType}, "
            f"processingStatus={self.processingStatus}, "
            f"municipality={self.municipality}"
            f")"
        )
    
    def mark_processing(self) -> None:
        """Mark this work unit as currently being processed."""
        self.processingStatus = Status.PROCESSING
    
    def mark_complete(self, parsed_object_gcs_uri: str) -> None:
        """
        Mark this work unit as complete and set the parsed object URI.
        
        Args:
            parsed_object_gcs_uri: GCS URI where the parsed result is stored
        """
        self.processingStatus = Status.COMPLETE
        self.parsedObjectGcsUri = parsed_object_gcs_uri
    
    def mark_failed(self) -> None:
        """Mark this work unit as failed processing."""
        self.processingStatus = Status.FAILED
    
    def is_pending(self) -> bool:
        """Check if this work unit is pending processing."""
        return self.processingStatus == Status.PENDING
    
    def is_processing(self) -> bool:
        """Check if this work unit is currently being processed."""
        return self.processingStatus == Status.PROCESSING
    
    def is_complete(self) -> bool:
        """Check if this work unit has been completed."""
        return self.processingStatus == Status.COMPLETE
    
    def is_failed(self) -> bool:
        """Check if this work unit has failed processing."""
        return self.processingStatus == Status.FAILED
