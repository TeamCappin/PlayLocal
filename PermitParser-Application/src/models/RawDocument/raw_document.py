from datetime import datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, ConfigDict

from .enums import DocumentType


class RawDocument(BaseModel):
    model_config = ConfigDict(
        arbitrary_types_allowed=True,
        use_enum_values=True,
        validate_assignment=True,
    )
    
    id: UUID = Field(
        default_factory=uuid4,
        description="Unique identifier for the document"
    )

    
    documentType: DocumentType = Field(
        ...,
        description="Type of document (permit, plan, approval, etc.)"
    )
    municipality: str = Field(
        ...,
        description="Municipality where the document was sourced from"
    )
    
    rawDataGcsUri: str = Field(
        ...,
        description="URI pointing to the raw document in Google Cloud Storage"
    )
    sourceUrl: str = Field(
        ...,
        description="Original URL where the document was scraped from"
    )
    
    def __str__(self) -> str:
        return f"RawDocument(id={self.id}, documentType={self.documentType}, municipality={self.municipality})"
    
    def __repr__(self) -> str:
        return (
            f"RawDocument("
            f"id={self.id}, "
            f"documentType={self.documentType}, "
            f"municipality={self.municipality}, "
            f"rawDataGcsUri={self.rawDataGcsUri}, "
            f"sourceUrl={self.sourceUrl}"
            f")"
        )