from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, ConfigDict, constr
from .enums import NodeType  # e.g. class NodeType(str, Enum): SECTION="SECTION" ...

class StructureNode(BaseModel):
    """
    Pydantic model representing a Structure Node in the document hierarchy.

    Fields:
        id: UUID for the node (unique identifier)
        parent_id: Optional UUID of the parent node (None for root)
        title: Human-readable title for the node
        node_type: NodeType enum indicating the type of node

    Notes:
        - This model is ERD-pure: it only includes the fields shown in the ERD.
        - Firestore stores UUIDs as strings; conversions are handled in (de)serialization.
    """

    id: UUID = Field(default_factory=uuid4)
    parent_id: Optional[UUID] = Field(
        default=None,
        # accept "parentId" on input; emit "parentId" on output
        validation_alias="parentId",
        serialization_alias="parentId",
    )
    title: constr(min_length=1) = Field(
        validation_alias="title", serialization_alias="title"
    )
    node_type: NodeType = Field(
        validation_alias="nodeType", serialization_alias="nodeType"
    )

    # allow population by alias (so parentId/nodeType work), keep immutability off for now
    model_config = ConfigDict(populate_by_name=True)

    def to_firestore_dict(self) -> Dict[str, Any]:
        """
        Convert the StructureNode to a Firestore-compatible dictionary.

        NOTE:
            Firestore has no native UUID type; we persist UUIDs as strings.
        Returns:
            Dictionary suitable for Firestore storage
        """
        return {
            "id": str(self.id),
            "parentId": str(self.parent_id) if self.parent_id else None,
            "title": self.title,
            "nodeType": self.node_type.value,
        }

    @classmethod
    def from_firestore_dict(cls, data: Dict[str, Any]) -> "StructureNode":
        """
        Create a StructureNode from Firestore data.

        Args:
            data: Dictionary containing Firestore document data

        Returns:
            StructureNode instance created from the data
        """
        return cls(
            id=UUID(data["id"]) if data.get("id") else uuid4(),
            parentId=UUID(data["parentId"]) if data.get("parentId") else None,
            title=data.get("title", ""),
            nodeType=NodeType.from_string(data.get("nodeType", "SECTION")),
        )

    def validate(self) -> bool:
        """
        Validate the StructureNode data.

        Returns:
            True if valid, raises ValueError if invalid

        Raises:
            ValueError: If validation fails
        """
        if not isinstance(self.id, UUID):
            raise ValueError("ID must be a valid UUID")

        if not isinstance(self.title, str):
            raise ValueError("Title must be a string")

        if not isinstance(self.node_type, NodeType):
            raise ValueError("Node type must be a valid NodeType enum")

        # parent_id must be UUID or None (ERD-pure); do NOT require str here.
        if self.parent_id is not None and not isinstance(self.parent_id, UUID):
            raise ValueError("Parent ID must be a UUID or None")

        return True

    # Handling Tree Structure

    def is_root(self) -> bool:
        """
        Check if this node is a root node (has no parent).

        Returns:
            True if this is a root node, False otherwise
        """
        return self.parent_id is None

    def is_leaf(self, children: List["StructureNode"]) -> bool:
        """
        Check if this node is a leaf node (has no children).

        Args:
            children: List of all nodes to check against

        Returns:
            True if this node has no children, False otherwise
        """
        # Compare UUID to UUID (no str(...) conversion)
        return not any(child.parent_id == self.id for child in children)

    def get_children(self, all_nodes: List["StructureNode"]) -> List["StructureNode"]:
        """
        Get all direct children of this node.

        Args:
            all_nodes: List of all nodes to search through

        Returns:
            List of direct child nodes
        """
        # Compare UUID to UUID (no str(...) conversion)
        return [node for node in all_nodes if node.parent_id == self.id]

    def get_ancestors(self, all_nodes: List["StructureNode"]) -> List["StructureNode"]:
        """
        Get all ancestor nodes of this node (parent, grandparent, etc.).

        Args:
            all_nodes: List of all nodes to search through

        Returns:
            List of ancestor nodes from parent to root
        """
        ancestors: List[StructureNode] = []
        current_parent_id = self.parent_id

        # Build a quick index by id for O(1) parent lookups
        by_id = {n.id: n for n in all_nodes}

        while current_parent_id:
            parent = by_id.get(current_parent_id)
            if parent:
                ancestors.append(parent)
                current_parent_id = parent.parent_id
            else:
                break

        return ancestors

    def get_descendants(
        self, all_nodes: List["StructureNode"]
    ) -> List["StructureNode"]:
        """
        Get all descendant nodes of this node (children, grandchildren, etc.).

        Args:
            all_nodes: List of all nodes to search through

        Returns:
            List of all descendant nodes
        """
        descendants: List[StructureNode] = []
        stack = [self]
        # Pre-index children by parent_id for speed
        by_parent = {}
        for n in all_nodes:
            by_parent.setdefault(n.parent_id, []).append(n)

        while stack:
            node = stack.pop()
            for child in by_parent.get(node.id, []):
                descendants.append(child)
                stack.append(child)

        # Exclude self if ever present
        return [n for n in descendants if n.id != self.id]

    def get_depth(self, all_nodes: List["StructureNode"]) -> int:
        """
        Get the depth of this node in the hierarchy (0 for root).

        Args:
            all_nodes: List of all nodes to search through

        Returns:
            Depth of the node (0-based)
        """
        return len(self.get_ancestors(all_nodes))

    def get_path(self, all_nodes: List["StructureNode"]) -> List[str]:
        """
        Get the path from root to this node as a list of titles.

        Args:
            all_nodes: List of all nodes to search through

        Returns:
            List of titles from root to this node
        """
        ancestors = self.get_ancestors(all_nodes)
        ancestors.reverse()  # Start from root
        path = [ancestor.title for ancestor in ancestors]
        path.append(self.title)
        return path

    def __str__(self) -> str:
        """String representation of the node."""
        return f"StructureNode(id={self.id}, title='{self.title}', type={self.node_type.value})"

    def __repr__(self) -> str:
        """Detailed string representation."""
        return (
            f"StructureNode(id={self.id}, parent_id={self.parent_id}, "
            f"title='{self.title}', node_type={self.node_type.value})"
        )
