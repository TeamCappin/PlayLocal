from uuid import UUID
from pydantic import BaseModel, Field

class DocumentCompleteEvent(BaseModel):
    """
    Published when all work units for a document have been completed.
    """
    document_id: UUID = Field(..., alias="documentId")
    project_id: str = Field(..., alias="projectId")
    municipality: str
    work_unit_count: int = Field(..., alias="workUnitCount")

    class Config:
        populate_by_name = True
        json_encoders = {UUID: str}