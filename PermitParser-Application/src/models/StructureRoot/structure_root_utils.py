from typing import Any, Dict
from uuid import UUID
from .structure_root import StructureRoot

class StructureRootUtils:
    """
    Provides utility functions for the StructureRoot model, particularly for
    interacting with Firestore.
    """

    @staticmethod
    def to_firestore_dict(root: StructureRoot) -> Dict[str, Any]:
        """
        Converts a StructureRoot model instance to a dictionary for
        storing in Firestore, UUIDs are converted to strings.
        """
        data = root.model_dump(by_alias=True)
        # Ensure UUIDs are stored as strings
        if 'documentId' in data and isinstance(data['documentId'], UUID):
            data['documentId'] = str(data['documentId'])
        return data

    @staticmethod
    def from_firestore_dict(data: Dict[str, Any]) -> StructureRoot:
        """
        Creates a StructureRoot model instance from a dictionary retrieved
        from Firestore.
        """
        valid_fields = {
            'id', 'projectId', 'documentType', 'municipality', 
            'rawDataGcsUri', 'sourceUrl'
        }
        # Filter out any extraneous fields not defined in the model
        filtered = {k: v for k, v in data.items() if k in valid_fields}
        # Convert document_id back to UUID if it's a string
        if 'document_id' in filtered and isinstance(filtered['document_id'], str):
            filtered['document_id'] = UUID(filtered['document_id'])
        return StructureRoot(**filtered)

    @staticmethod
    def create_structure_root(
        document_id: UUID,
        project_id: str,
        work_unit_count: int,
        root_node_id: str,
        municipality: str,
        **kwargs: Any
    ) -> StructureRoot:
        """
        Creates a new StructureRoot instance with the provided details.
        """
        return StructureRoot(
            document_id=document_id,
            project_id=project_id,
            work_unit_count=work_unit_count,
            root_node_id=root_node_id,
            municipality=municipality,
            **kwargs
        )