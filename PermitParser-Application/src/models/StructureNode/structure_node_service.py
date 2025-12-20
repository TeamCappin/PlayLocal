"""
StructureNode Service (ERD-pure)
--------------------------------
This module provides minimal Firestore operations for StructureNode documents
stored under the top-level 'structureNodes' collection.

Notes:
- The data shape is ERD-pure: id, parentId, title, nodeType only.
- UUIDs are persisted as strings in Firestore.
- No extra fields (e.g., projectId/documentId/order/path).
"""

from typing import Any, Dict, List, Optional
from uuid import UUID, uuid4
from google.cloud import firestore

from .structure_node import StructureNode
from .enums import NodeType

NODES_COL = "structureNodes"


def _db() -> firestore.Client:
    """
    Get a Firestore client.
    Works with the emulator if FIRESTORE_EMULATOR_HOST is set.
    """
    return firestore.Client()


# ---------------------------- Create ----------------------------

def create_node(
    *,
    title: str,
    node_type: NodeType,
    parent_id: Optional[UUID] = None,
    db: Optional[firestore.Client] = None,
) -> str:
    """
    Create a new StructureNode document.

    Args:
        title: Node title
        node_type: NodeType enum
        parent_id: Optional UUID of the parent node (None for root)
        db: Optional Firestore client (useful for tests)

    Returns:
        The new node's id as a string (UUID string).
    """
    db = db or _db()
    coll = db.collection(NODES_COL)

    node = StructureNode(
        id=uuid4(),
        parentId=parent_id,
        title=title,
        nodeType=node_type,
    )
    data = node.to_firestore_dict()
    doc_id = data["id"]  # UUID string
    coll.document(doc_id).set(data)
    return doc_id


# ----------------------------- Read -----------------------------

def get_node(node_id: str, *, db: Optional[firestore.Client] = None) -> Optional[Dict[str, Any]]:
    """
    Fetch a single StructureNode by id.

    Args:
        node_id: UUID string of the node document
        db: Optional Firestore client

    Returns:
        Dict of the node data if found, else None.
    """
    db = db or _db()
    snap = db.collection(NODES_COL).document(node_id).get()
    return snap.to_dict() if snap.exists else None


def list_children(
    *,
    parent_id: Optional[str],
    db: Optional[firestore.Client] = None,
) -> List[Dict[str, Any]]:
    """
    List direct children for a given parentId.

    Args:
        parent_id: UUID string of the parent (or None for root-level nodes)
        db: Optional Firestore client

    Returns:
        List of child node dicts.
    """
    db = db or _db()
    q = db.collection(NODES_COL).where("parentId", "==", parent_id)
    return [d.to_dict() for d in q.stream()]


def get_subtree(
    *,
    node_id: str,
    db: Optional[firestore.Client] = None,
    include_self: bool = True,
) -> List[Dict[str, Any]]:
    """
    Fetch a node and all of its descendants.

    NOTE:
        ERD-pure schema has no 'path' field; we perform a BFS:
        repeatedly query children by parentId.

    Args:
        node_id: UUID string of the root of the subtree
        db: Optional Firestore client
        include_self: include the root node in the result

    Returns:
        List of node dicts (root-first order if include_self=True).
    """
    db = db or _db()
    coll = db.collection(NODES_COL)

    root_snap = coll.document(node_id).get()
    if not root_snap.exists:
        return []

    result: List[Dict[str, Any]] = []
    if include_self:
        result.append(root_snap.to_dict())

    frontier = [node_id]
    while frontier:
        next_frontier: List[str] = []
        for pid in frontier:
            for snap in coll.where("parentId", "==", pid).stream():
                result.append(snap.to_dict())
                next_frontier.append(snap.id)
        frontier = next_frontier

    return result


# ---------------------------- Update ----------------------------

def update_node(
    node_id: str,
    *,
    title: Optional[str] = None,
    node_type: Optional[NodeType] = None,
    db: Optional[firestore.Client] = None,
) -> None:
    """
    Patch a StructureNode's basic fields.

    Args:
        node_id: UUID string of the node to update
        title: Optional new title
        node_type: Optional new NodeType
        db: Optional Firestore client
    """
    updates: Dict[str, Any] = {}
    if title is not None:
        if not isinstance(title, str) or not title.strip():
            raise ValueError("title must be a non-empty string")
        updates["title"] = title.strip()
    if node_type is not None:
        updates["nodeType"] = node_type.value if isinstance(node_type, NodeType) else str(node_type)

    if not updates:
        return  # nothing to do

    db = db or _db()
    db.collection(NODES_COL).document(node_id).update(updates)


# ---------------------------- Delete ----------------------------

def delete_subtree(
    *,
    node_id: str,
    db: Optional[firestore.Client] = None,
) -> int:
    """
    Delete a node and all its descendants.

    NOTE:
        ERD-pure schema has no 'path' field; we perform a BFS to collect all ids,
        then delete in batches to avoid hitting write limits.

    Args:
        node_id: UUID string of the node to delete
        db: Optional Firestore client

    Returns:
        Total number of documents deleted (including the root).
    """
    db = db or _db()
    coll = db.collection(NODES_COL)

    root = coll.document(node_id).get()
    if not root.exists:
        return 0

    # BFS to collect ids
    ids: List[str] = [node_id]
    frontier = [node_id]
    while frontier:
        next_frontier: List[str] = []
        for pid in frontier:
            for snap in coll.where("parentId", "==", pid).stream():
                ids.append(snap.id)
                next_frontier.append(snap.id)
        frontier = next_frontier

    # batched deletes (<= 450 per batch to stay under 500 ops guideline)
    deleted = 0
    for i in range(0, len(ids), 450):
        batch = db.batch()
        for _id in ids[i:i+450]:
            batch.delete(coll.document(_id))
        batch.commit()
        deleted += len(ids[i:i+450])
    return deleted
