
from typing import Dict, Any, Optional
from uuid import UUID

from .work_unit import WorkUnit
from .enums import ContentType, Status


class WorkUnitUtils:
    """Utility methods for WorkUnit model operations."""
    @staticmethod
    def get_raw_content_bucket(work_unit: WorkUnit) -> str:
        """Extract the GCS bucket name from the raw content URI."""
        parts = work_unit.rawContentGcsUri.split('/')
        if len(parts) < 3:
            raise ValueError(f"Invalid GCS URI format: {work_unit.rawContentGcsUri}")
        return parts[2]
    
    @staticmethod
    def get_raw_content_path(work_unit: WorkUnit) -> str:
        """Extract the GCS object path from the raw content URI."""
        parts = work_unit.rawContentGcsUri.split('/')
        if len(parts) < 4:
            raise ValueError(f"Invalid GCS URI format: {work_unit.rawContentGcsUri}")
        return '/'.join(parts[3:])
    
    @staticmethod
    def get_parsed_object_bucket(work_unit: WorkUnit) -> Optional[str]:
        """Extract the GCS bucket name from the parsed object URI."""
        if not work_unit.parsedObjectGcsUri:
            return None
        parts = work_unit.parsedObjectGcsUri.split('/')
        if len(parts) < 3:
            raise ValueError(f"Invalid GCS URI format: {work_unit.parsedObjectGcsUri}")
        return parts[2]
    
    @staticmethod
    def get_parsed_object_path(work_unit: WorkUnit) -> Optional[str]:
        """Extract the GCS object path from the parsed object URI."""
        if not work_unit.parsedObjectGcsUri:
            return None
        parts = work_unit.parsedObjectGcsUri.split('/')
        if len(parts) < 4:
            raise ValueError(f"Invalid GCS URI format: {work_unit.parsedObjectGcsUri}")
        return '/'.join(parts[3:])
    
    @staticmethod
    def get_content_file_extension(work_unit: WorkUnit) -> Optional[str]:
        """Get the file extension from the raw content GCS URI."""
        path = WorkUnitUtils.get_raw_content_path(work_unit)
        if '.' in path:
            return path.split('.')[-1].lower()
        return None
    
    @staticmethod
    def is_text_content(work_unit: WorkUnit) -> bool:
        """Check if this work unit contains text content."""
        return work_unit.contentType == ContentType.TEXT
    
    @staticmethod
    def is_table_content(work_unit: WorkUnit) -> bool:
        """Check if this work unit contains table content."""
        return work_unit.contentType == ContentType.TABLE
    
    @staticmethod
    def is_image_content(work_unit: WorkUnit) -> bool:
        """Check if this work unit contains image content."""
        return work_unit.contentType == ContentType.IMAGE
    
    @staticmethod
    def to_firestore_dict(work_unit: WorkUnit) -> Dict[str, Any]:
        """ Convert a WorkUnit to a dictionary suitable for Firestore storage."""
        return {
            'id': str(work_unit.id),
            'documentId': work_unit.documentId,
            'projectId': work_unit.projectId,
            'structureNodeId': work_unit.structureNodeId,
            'contentType': work_unit.contentType.value,
            'rawContentGcsUri': work_unit.rawContentGcsUri,
            'parsedObjectGcsUri': work_unit.parsedObjectGcsUri,
            'processingStatus': work_unit.processingStatus.value,
            'municipality': work_unit.municipality,
        }
    
    @staticmethod
    def from_firestore_dict(data: Dict[str, Any]) -> WorkUnit:
        """ Create a WorkUnit instance from Firestore document data."""
        # Remove any fields that don't exist in WorkUnit
        valid_fields = {
            'id', 'documentId', 'projectId', 'structureNodeId', 'contentType',
            'rawContentGcsUri', 'parsedObjectGcsUri', 'processingStatus', 'municipality'
        }
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        
        # Convert string UUID back to UUID object if needed
        if isinstance(filtered_data.get('id'), str):
            filtered_data['id'] = UUID(filtered_data['id'])
        
        return WorkUnit(**filtered_data)
    
    @staticmethod
    def create_text_work_unit(
        document_id: str,
        project_id: str,
        structure_node_id: str,
        raw_content_gcs_uri: str,
        municipality: str,
        **kwargs
    ) -> WorkUnit:
        """Factory method to create a WorkUnit instance for text content."""
        return WorkUnit(
            documentId=document_id,
            projectId=project_id,
            structureNodeId=structure_node_id,
            contentType=ContentType.TEXT,
            rawContentGcsUri=raw_content_gcs_uri,
            municipality=municipality,
            **kwargs
        )
    
    @staticmethod
    def create_table_work_unit(
        document_id: str,
        project_id: str,
        structure_node_id: str,
        raw_content_gcs_uri: str,
        municipality: str,
        **kwargs
    ) -> WorkUnit:
        """Factory method to create a WorkUnit instance configured for table content."""
        return WorkUnit(
            documentId=document_id,
            projectId=project_id,
            structureNodeId=structure_node_id,
            contentType=ContentType.TABLE,
            rawContentGcsUri=raw_content_gcs_uri,
            municipality=municipality,
            **kwargs
        )
    
    @staticmethod
    def create_image_work_unit(
        document_id: str,
        project_id: str,
        structure_node_id: str,
        raw_content_gcs_uri: str,
        municipality: str,
        **kwargs
    ) -> WorkUnit:
        """Factory method to create a WorkUnit instance configured for image content."""
        return WorkUnit(
            documentId=document_id,
            projectId=project_id,
            structureNodeId=structure_node_id,
            contentType=ContentType.IMAGE,
            rawContentGcsUri=raw_content_gcs_uri,
            municipality=municipality,
            **kwargs
        )
    
    @staticmethod
    def generate_parsed_object_uri(
        work_unit: WorkUnit,
        parsed_bucket: str,
        file_extension: str = "json"
    ) -> str:
        """
        Generate a GCS URI for the parsed object based on the work unit.
        This follows the project-organized structure: /{projectId}/{documentId}/...
        Returns:
            GCS URI for the parsed object
        """
        return (
            f"gs://{parsed_bucket}/"
            f"{work_unit.projectId}/"
            f"{work_unit.documentId}/"
            f"parsed/"
            f"{work_unit.structureNodeId}_{work_unit.contentType.value.lower()}.{file_extension}"
        )
