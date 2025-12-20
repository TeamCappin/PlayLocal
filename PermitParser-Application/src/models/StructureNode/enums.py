from enum import Enum

class NodeType(str, Enum):
    """
    Enum representing the type of structure node in the document hierarchy.
    
    Based on the ERD and domain model specifications:
    - SECTION: Major document sections
    - SUBSECTION: Subsections within sections
    - PARAGRAPH: Individual paragraphs
    - TABLE: Tabular data
    - IMAGE: Image content
    """
    SECTION = "SECTION"
    SUBSECTION = "SUBSECTION"
    PARAGRAPH = "PARAGRAPH"
    TABLE = "TABLE"
    IMAGE = "IMAGE"

    @classmethod
    def from_string(cls, value: str) -> "NodeType":
        """
        Convert a string (possibly mixed case / with spaces) into a NodeType.
        Defaults to SECTION if value is falsy.
        """
        if not value:
            return cls.SECTION
        return cls(value.strip().upper())
