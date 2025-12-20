# lib/config.py (Updated to be simpler)

import yaml
from pathlib import Path
from typing import Any, Dict

class ScraperConfig:
    """
    Handles loading and accessing high-level configuration.
    Selectors and parsing rules should NOT be in this config.
    """
    def __init__(self, file_path: Path):
        self.config: Dict[str, Any] = self._load_config(file_path)

    def _load_config(self, file_path: Path) -> Dict[str, Any]:
        """Loads configuration from a YAML file."""
        if not file_path.exists():
            raise FileNotFoundError(f"Config file not found: {file_path}")
        with open(file_path, 'r') as f:
            return yaml.safe_load(f)

    def get_scraper_settings(self, municipality: str, scraper_name: str) -> Dict[str, Any]:
        """Retrieves general settings for a specific scraper."""
        try:
            return self.config[municipality]['scrapers'][scraper_name]
        except KeyError as e:
            raise ValueError(f"Settings not found for {municipality}/{scraper_name}. Error: {e}")