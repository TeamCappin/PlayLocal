# lib/abstract_scraper.py

from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional, TypeVar, Generic
from playwright.async_api import ElementHandle 
T = TypeVar("T")

class AbstractWebHandler(ABC, Generic[T]):
    """
    Abstract class for handling web access (fetching content, managing browser).
    """
    @abstractmethod
    async def fetch_rows(self) -> List[T]:
        """
        Connects to the source URL, handles pagination, and returns a list
        of raw HTML elements (e.g., table rows) to be parsed.
        """
        pass

class AbstractParser(ABC):
    """
    Abstract class for processing raw content into structured data.
    """
    @abstractmethod
    async def parse_element(self, element: ElementHandle) -> Optional[Dict[str, Any]]:
        """
        Takes a single raw HTML element (e.g., a table row) and extracts
        the necessary data, applying any domain-specific cleanup or
        classification.
        """
        pass

    @abstractmethod
    async def parse_all(self, elements: List[ElementHandle]) -> List[Dict[str, Any]]:
        """
        The main parsing method, processing a list of raw elements.
        """
        pass