
from enum import Enum


class ContentType(str, Enum):
    """Types of content that can be processed in a WorkUnit."""
    TEXT = "TEXT"
    TABLE = "TABLE"
    IMAGE = "IMAGE"


class Status(str, Enum):
    """Processing status for WorkUnits."""
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"
