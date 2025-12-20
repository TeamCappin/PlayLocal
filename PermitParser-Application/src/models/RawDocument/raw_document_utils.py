from typing import Optional, Dict, Any
from .raw_document import RawDocument
from .enums import DocumentType

class RawDocumentUtils:
    @staticmethod
    def get_document_extension(doc: RawDocument) -> Optional[str]:
        # Extract path directly from GCS URI
        parts = doc.rawDataGcsUri.split('/')
        if len(parts) >= 4:  # gs://bucket/path/file.ext
            path = '/'.join(parts[3:])  # Get everything after bucket
            if '.' in path:
                return path.split('.')[-1].lower()
        return None
    
    @staticmethod
    def is_pdf(doc: RawDocument) -> bool:
        return RawDocumentUtils.get_document_extension(doc) == 'pdf'
    
    @staticmethod
    def is_image(doc: RawDocument) -> bool:
        image_extensions = {'jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff'}
        return RawDocumentUtils.get_document_extension(doc) in image_extensions
    
    @staticmethod
    def get_gcs_bucket(doc: RawDocument) -> str:
        parts = doc.rawDataGcsUri.split('/')
        if len(parts) < 3:
            raise ValueError(f"Invalid GCS URI format: {doc.rawDataGcsUri}")
        return parts[2]
    
    @staticmethod
    def get_gcs_path(doc: RawDocument) -> str:
        parts = doc.rawDataGcsUri.split('/')
        if len(parts) < 4:
            raise ValueError(f"Invalid GCS URI format: {doc.rawDataGcsUri}")
        return '/'.join(parts[3:])
    
    @staticmethod
    def to_firestore_dict(doc: RawDocument) -> Dict[str, Any]:
        return {
            'id': str(doc.id),
            'projectId': doc.projectId,
            'documentType': doc.documentType.value,
            'municipality': doc.municipality,
            'rawDataGcsUri': doc.rawDataGcsUri,
            'sourceUrl': doc.sourceUrl,
        }
    
    @staticmethod
    def from_firestore_dict(data: Dict[str, Any]) -> RawDocument:
        """
        Create a RawDocument instance from a Firestore dictionary.

        Note:
            As of Iteration 3, the 'projectId' field is no longer accepted and will be filtered out
            during deserialization. Older Firestore documents containing 'projectId' will have that field
            ignored. This is a breaking change from previous versions.

        Args:
            data (Dict[str, Any]): The Firestore document data.

        Returns:
            RawDocument: The deserialized RawDocument instance.
        """
        # Remove any fields that don't exist in RawDocument
        valid_fields = {
            'id', 'documentType', 'municipality', 
            'rawDataGcsUri', 'sourceUrl'
        }
        filtered_data = {k: v for k, v in data.items() if k in valid_fields}
        return RawDocument(**filtered_data)
    
    @staticmethod
    def create_permit_document(
        municipality: str,
        gcs_uri: str,
        source_url: str,
        **kwargs
    ) -> RawDocument:
        return RawDocument(
            documentType=DocumentType.PERMIT,
            municipality=municipality,
            rawDataGcsUri=gcs_uri,
            sourceUrl=source_url,
            **kwargs
        )
    
    @staticmethod
    def create_plan_document(
        municipality: str,
        gcs_uri: str,
        source_url: str,
        **kwargs
    ) -> RawDocument:
        return RawDocument(
            documentType=DocumentType.PLAN,
            municipality=municipality,
            rawDataGcsUri=gcs_uri,
            sourceUrl=source_url,
            **kwargs
        )
