"""
Simple storage utilities for scrapers.
Provides functions to save data to files without complexity.
"""
import json
import logging
import hashlib
from pathlib import Path
from datetime import date
from typing import List, Dict, Any

logger = logging.getLogger(__name__)

# Global constant for data directory
DATA_DIR = Path("./data")


def save_to_file(
    documents: List[Dict[str, Any]], 
    scraper_name: str,
    municipality: str,
    format: str = "jsonl"
) -> Path:
    """    
    Args:
        documents: List of document dictionaries
        scraper_name: Name of scraper (e.g., "council")
        municipality: Municipality name (e.g., "laval")
        format: "jsonl" or "json"
        
    Returns:
        Path to saved file
    """
    if not documents:
        logger.warning("No documents to save")
        raise ValueError("No documents to save")
    
    supported_formats = ["jsonl", "json"]
    if format not in supported_formats:
        raise ValueError(f"Unsupported format: {format}")
    
    # Create directory structure: ./data/municipality/scraper_name/
    output_dir = DATA_DIR / municipality / scraper_name
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename with today's date
    today = date.today().isoformat()
    filename = f"{scraper_name}_{today}.{format}"
    filepath = output_dir / filename
    
    # Save based on format
    if format == "jsonl":
        with open(filepath, 'w', encoding='utf-8') as f:
            for doc in documents:
                f.write(json.dumps(doc, ensure_ascii=False) + '\n')
    else:  # json
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(documents, f, ensure_ascii=False, indent=2)
    
    logger.info(f"✓ Saved {len(documents)} documents to: {filepath}")
    return filepath


def print_to_stdout(documents: List[Dict[str, Any]]) -> None:
    for doc in documents:
        print(json.dumps(doc, ensure_ascii=False))


def sha256_of_file(filepath: str | Path) -> str:
    """
    Compute SHA-256 checksum of a file.
        
    Returns:
        SHA-256 hex digest
    """
    filepath = Path(filepath)
    h = hashlib.sha256()
    
    try:
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
    except Exception as e:
        logger.error(f"Failed to read file {filepath}: {e}")
        raise
    
    return h.hexdigest()


def sha256_of_bytes(data: bytes) -> str:
    """
    Compute SHA-256 checksum of bytes.
    
    Args:
        data: Raw bytes
        
    Returns:
        SHA-256 hex digest
    """
    return hashlib.sha256(data).hexdigest()