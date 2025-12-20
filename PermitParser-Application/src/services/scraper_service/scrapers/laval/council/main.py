# scrapers/laval/council_headless/main.py
from __future__ import annotations
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3] 
sys.path.append(str(PROJECT_ROOT))

import asyncio
import logging
from lib.logging_conf import configure_logging
from lib.cli import get_scraper_parser
from lib.storage.local import save_to_file, print_to_stdout
from lib.config import ScraperConfig 

from .web_handler import LavalCouncilWebHandler
from .web_parser import LavalCouncilParser


async def run_scraper(web_handler, parser):
    """Fetch and parse data."""
    logging.info("Starting Web Handler...")
    raw_elements = await web_handler.fetch_rows()
    logging.info(f"✓ Fetched {len(raw_elements)} raw elements")
    
    logging.info("Starting Parser...")
    structured_data = parser.parse_all(raw_elements)
    logging.info(f"✓ Parsed {len(structured_data)} unique records")
    
    return structured_data


def main():
    configure_logging()
    
    # Parse arguments using shared CLI
    parser = get_scraper_parser(description="Laval Council Headless Scraper")
    args = parser.parse_args()
    
    # Config
    MUNICIPALITY = "laval"
    SCRAPER_NAME = "council"
    CONFIG_PATH = PROJECT_ROOT / "config" / "sources.yaml"
    
    try:
        config = ScraperConfig(CONFIG_PATH)
        settings = config.get_scraper_settings(MUNICIPALITY, SCRAPER_NAME)
        
        web_handler = LavalCouncilWebHandler(settings)
        parser = LavalCouncilParser()
        
    except (FileNotFoundError, ValueError) as e:
        logging.error(f"Configuration error: {e}")
        return
    
    # Run scraper
    documents = asyncio.run(run_scraper(web_handler, parser))
    
    if not documents:
        logging.warning("No data scraped")
        return
    
    # Output based on --output flag
    if args.output == 'STDOUT':
        logging.info(f"Printing {len(documents)} documents to console...")
        print_to_stdout(documents)
    
    elif args.output == 'FILE':
        logging.info(f"Saving {len(documents)} documents to file...")
        save_to_file(documents, SCRAPER_NAME, MUNICIPALITY, format="jsonl")
    
    elif args.output == 'GCS':
        logging.error("GCS output not implemented yet")
        sys.exit(1)


if __name__ == "__main__":
    main()