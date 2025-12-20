from uuid import UUID
from pydantic import BaseModel, Field

class DocumentProcessingTask(BaseModel):
    """
    Represents the payload for a document processing task from Cloud Tasks.
    """
    document_id: UUID = Field(..., alias="documentId")
    municipality: str
    task_id: str = Field(..., alias="taskId")

    class Config:
        populate_by_name = True

class CompletionTrackerTask(BaseModel):
    """
    Represents the payload for a completion tracking task from Cloud Tasks.
    """
    document_id: UUID = Field(..., alias="documentId")
    project_id: str = Field(..., alias="projectId")
    
    class Config:
        populate_by_name = True