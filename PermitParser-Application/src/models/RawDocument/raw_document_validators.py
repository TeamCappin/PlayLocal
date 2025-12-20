import re
from urllib.parse import urlparse
from typing import Optional

from pydantic import field_validator, model_validator

from .raw_document import RawDocument

class RawDocumentValidators:
    @staticmethod
    @field_validator('rawDataGcsUri')
    def validate_gcs_uri(cls, v: str) -> str:
        if not v.startswith('gs://'):
            raise ValueError('GCS URI must start with gs://')

        gcs_pattern = r'^gs://[a-z0-9][a-z0-9-]*[a-z0-9]/(.+)$'
        if not re.match(gcs_pattern, v):
            raise ValueError('Invalid GCS URI format')

        return v

    @staticmethod
    @field_validator('sourceUrl')
    def validate_source_url(cls, v: str) -> str:
        parsed = urlparse(v)
        if not parsed.scheme or not parsed.netloc:
            raise ValueError('Source URL must be a valid HTTP/HTTPS URL')

        return v

    @staticmethod
    @field_validator('projectId')
    def validate_projectid(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Project ID cannot be empty')

        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Project ID must contain only alphanumeric characters, hyphens, and underscores')

        return v.strip()

    @staticmethod
    @field_validator('municipality')
    def validate_municipality(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Municipality cannot be empty')

        return v.strip().title()

   