from enum import Enum


class DocumentType(str, Enum):
    PERMIT = "permit"
    PLAN = "plan"
    APPROVAL = "approval"
    INSPECTION = "inspection"
    CERTIFICATE = "certificate"
    NOTICE = "notice"
    OTHER = "other"