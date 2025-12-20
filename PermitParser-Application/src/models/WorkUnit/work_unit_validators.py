
import re
from typing import Optional
import logging
from pydantic import field_validator, model_validator

from .work_unit import WorkUnit

logger = logging.getLogger(__name__)

class WorkUnitValidators:

    """Validation methods for WorkUnit model fields."""
    @staticmethod
    @field_validator('rawContentGcsUri')
    def validate_raw_content_gcs_uri(cls, v: str) -> str:
        """Validate that the raw content GCS URI is properly formatted."""
        if not v.startswith('gs://'):
            raise ValueError('Raw content GCS URI must start with gs://')

        gcs_pattern = r'^gs://[a-z0-9][a-z0-9-]*[a-z0-9]/(.+)$'
        if not re.match(gcs_pattern, v):
            raise ValueError('Invalid raw content GCS URI format')

        return v
    
    @staticmethod
    @field_validator('parsedObjectGcsUri')
    def validate_parsed_object_gcs_uri(cls, v: Optional[str]) -> Optional[str]:
        """Validate that the parsed object GCS URI is properly formatted."""
        if v is None:
            return v
            
        if not v.startswith('gs://'):
            raise ValueError('Parsed object GCS URI must start with gs://')

        gcs_pattern = r'^gs://[a-z0-9][a-z0-9-]*[a-z0-9]/(.+)$'
        if not re.match(gcs_pattern, v):
            raise ValueError('Invalid parsed object GCS URI format')

        return v
    
    @staticmethod
    @field_validator('projectId')
    def validate_project_id(cls, v: str) -> str:
        """Validate that the project ID is properly formatted."""
        if not v or not v.strip():
            raise ValueError('Project ID cannot be empty')

        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Project ID must contain only alphanumeric characters, hyphens, and underscores')

        return v.strip()
    
    @staticmethod
    @field_validator('documentId')
    def validate_document_id(cls, v: str) -> str:
        """Validate that the document ID is properly formatted."""
        if not v or not v.strip():
            raise ValueError('Document ID cannot be empty')

        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Document ID must contain only alphanumeric characters, hyphens, and underscores')

        return v.strip()
    
    @staticmethod
    @field_validator('structureNodeId')
    def validate_structure_node_id(cls, v: str) -> str:
        """Validate that the structure node ID is properly formatted."""
        if not v or not v.strip():
            raise ValueError('Structure node ID cannot be empty')

        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Structure node ID must contain only alphanumeric characters, hyphens, and underscores')

        return v.strip()
    
    @staticmethod
    @field_validator('municipality')
    def validate_municipality(cls, v: str) -> str:
        """Validate that the municipality name is properly formatted."""
        if not v or not v.strip():
            raise ValueError('Municipality cannot be empty')

        return v.strip().title()
    
    @staticmethod
    @model_validator(mode='after')
    def validate_gcs_uri_consistency(cls, values):
        """
        Validate that GCS URIs are consistent with project and document structure.
        This ensures that the GCS URIs follow the expected project-organized structure.
        """
        # Check raw content URI structure
        if hasattr(values, 'rawContentGcsUri') and hasattr(values, 'projectId') and hasattr(values, 'documentId'):
            raw_uri = values.rawContentGcsUri
            project_id = values.projectId
            document_id = values.documentId
            
            # Expected pattern: gs://bucket/{projectId}/{documentId}/...
            expected_path_pattern = f".*/{project_id}/{document_id}/.*"
            if not re.search(expected_path_pattern, raw_uri):
                logger.warning(
                    "Raw content GCS URI does not follow expected project structure. "
                    f"Expected pattern: 'gs://bucket/{project_id}/{document_id}/...' "
                    f"but got: '{raw_uri}'. This may cause issues with project organization."
                )
        
        # Check parsed object URI structure (if set)
        if hasattr(values, 'parsedObjectGcsUri') and values.parsedObjectGcsUri:
            if hasattr(values, 'projectId') and hasattr(values, 'documentId'):
                parsed_uri = values.parsedObjectGcsUri
                project_id = values.projectId
                document_id = values.documentId
                
                # Expected pattern: gs://bucket/{projectId}/{documentId}/parsed/...
                expected_path_pattern = f".*/{project_id}/{document_id}/.*"
                if not re.search(expected_path_pattern, parsed_uri):
                    logger.warning(
                        "Parsed object GCS URI does not follow expected project structure. "
                        f"Expected pattern: 'gs://bucket/{project_id}/{document_id}/parsed/...' "
                        f"but got: '{parsed_uri}'. This may cause issues with result retrieval."
                    )
                
                # Additional check: parsed objects should be in 'parsed' subdirectory
                parsed_subdir_pattern = f".*/{project_id}/{document_id}/parsed/.*"
                if not re.search(parsed_subdir_pattern, parsed_uri):
                    logger.warning(
                        "Parsed object should be in 'parsed' subdirectory. "
                        f"Expected: 'gs://bucket/{project_id}/{document_id}/parsed/...' "
                        f"but got: '{parsed_uri}'. Consider using WorkUnitUtils.generate_parsed_object_uri()."
                    )
        
        return values
