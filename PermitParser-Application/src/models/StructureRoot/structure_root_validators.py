import re
from pydantic import model_validator, field_validator

def validate_work_units(self):
    """
    Validates that the number of completed work units is not greater than the total work unit count.
    """
    if self.completed_work_units > self.work_unit_count:
        raise ValueError("completed_work_units cannot be greater than work_unit_count")
    return self

def validate_municipality(cls, v: str) -> str:
    """
    Validates that the municipality is not an empty string, also normalizes it.
    """
    if not v or not v.strip():
        raise ValueError('Municipality cannot be empty')
    return v.strip().title()

def validate_root_node_id(cls, v: str) -> str:
    """
    Validates that the root_node_id is not an empty string.
    """
    if not v or not v.strip():
        raise ValueError('root_node_id cannot be empty')
    return v.strip()


def validate_project_ids(cls, v: list) -> list:
    """
    Validates that project_ids is a non-empty list of valid project ID strings.
    Each project ID must be a non-empty string containing only alphanumeric characters, hyphens, and underscores.
    """
    if not isinstance(v, list) or len(v) == 0:
        raise ValueError('project_ids must be a non-empty list')
    for pid in v:
        if not isinstance(pid, str) or not pid.strip():
            raise ValueError('Each project ID must be a non-empty string')
        if not re.match(r'^[a-zA-Z0-9_-]+$', pid):
            raise ValueError('Project ID must contain only alphanumeric characters, hyphens, and underscores')
    return [pid.strip() for pid in v]