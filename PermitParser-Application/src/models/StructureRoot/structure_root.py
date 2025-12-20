from pydantic import BaseModel, Field, ConfigDict, field_validator, model_validator
from pydantic.alias_generators import to_camel
from uuid import UUID, uuid4
from typing import List
from .structure_root_validators import (
    validate_work_units, 
    validate_municipality, 
    validate_root_node_id,
    validate_project_ids
)

class StructureRoot(BaseModel):
    """
    A Firestore document, the root metadata entry for a
    processed document. It contains counters and references for
    tracking the document's parsing progress.
    """
    # Register validators from the external file
    _validate_work_units = model_validator(mode='after')(validate_work_units)
    _validate_municipality = field_validator('municipality')(validate_municipality)
    _validate_root_node_id = field_validator('root_node_id')(validate_root_node_id)
    _validate_project_ids = field_validator('project_ids')(validate_project_ids)

    document_id: UUID #ID of the RawDocument being processed

    project_ids: List[str] #IDs of related parent Projects, provides business context

    work_unit_count: int = Field(ge=0) #Total number of work units for this document
    
    completed_work_units: int = Field(default=0, ge=0) #Number of completed work units

    root_node_id: str #ID of the root StructureNode in the document's hierarchical tree

    municipality: str #The municipality associated with the document, for data partitioning

    def is_complete(self) -> bool:
        """
        Checks if the number of completed work units is greater than or equal to the total count.
        """
        return self.work_unit_count > 0 and self.completed_work_units >= self.work_unit_count

    """
    Pydantic model configuration.

    - `alias_generator = to_camel`: Converts snake_case field names to camelCase for JSON serialization.
    - `populate_by_name = True`: Allows populating the model using either the field name or its alias.
    """
    model_config = ConfigDict(
        alias_generator = to_camel,
        populate_by_name = True,
        json_schema_extra = {
            "example": {
                "documentId": "123e4567-e89b-12d3-a456-426614174000",
                "projectId": "proj-756",
                "workUnitCount": 50,
                "completedWorkUnits": 25,
                "rootNodeId": "node-123",
                "municipality": "Laval"
            }
        }
    )
