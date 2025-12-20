"""Entrypoint for the Montréal role evaluation scraper.

This module closely mirrors the Laval council scraper.  It loads
configuration from ``config/sources.yaml``, constructs a web handler
and parser, runs them asynchronously, and emits the resulting
records to the desired output (stdout or a JSONL file).
"""

from __future__ import annotations

import asyncio
import logging
import sys
from pathlib import Path
from typing import Any, Dict, List

PROJECT_ROOT = Path(__file__).resolve().parents[3]
sys.path.append(str(PROJECT_ROOT))

from lib.logging_conf import configure_logging
from lib.cli import get_scraper_parser
from lib.storage.local import save_to_file, print_to_stdout
from lib.config import ScraperConfig

from .web_handler import MontrealRoleEvaluationWebHandler
from .web_parser import MontrealRoleEvaluationParser


async def run_scraper(web_handler: MontrealRoleEvaluationWebHandler,
                      parser: MontrealRoleEvaluationParser) -> List[Dict[str, Any]]:
    """Fetch and parse data.

    This function orchestrates the scraping process.  It first
    instructs the web handler to fetch raw HTML strings, then
    delegates to the parser to extract structured records.  Counts
    are logged for observability.

    Args:
        web_handler: Instantiated web handler for Montréal role evaluation.
        parser: Instantiated parser for Montréal role evaluation.

    Returns:
        A list of parsed record dictionaries.
    """
    logging.info("Starting Web Handler...")
    raw_elements = await web_handler.fetch_rows()
    logging.info(f"\u2713 Fetched {len(raw_elements)} raw elements")

    logging.info("Starting Parser...")
    structured_data = parser.parse_all(raw_elements)
    logging.info(f"\u2713 Parsed {len(structured_data)} unique records")

    return structured_data


def main() -> None:
    """Main entrypoint.

    Configure logging, parse CLI arguments, load configuration and
    instantiate the web handler and parser.  The asynchronous
    scraping function is executed via ``asyncio.run``.  Results are
    then directed to stdout or a file based on the ``--output`` flag.
    """
    configure_logging()

    parser = get_scraper_parser(description="Montréal Role Evaluation Scraper")
    parser.add_argument(
        "--start-lot",
        dest="start_lot",
        type=int,
        help="First lot number to query (must be > 10000 and < --end-lot).",
    )
    parser.add_argument(
        "--end-lot",
        dest="end_lot",
        type=int,
        help="Last lot number to query (exclusive). Must be > --start-lot.",
    )


  
    args = parser.parse_args()

    # Identifiers used in the configuration hierarchy.
    MUNICIPALITY = "montreal"
    SCRAPER_NAME = "role_evaluation"
    CONFIG_PATH = PROJECT_ROOT / "config" / "sources.yaml"

    try:
        config = ScraperConfig(CONFIG_PATH)
        settings = config.get_scraper_settings(MUNICIPALITY, SCRAPER_NAME)
        # ---- CLI → settings overrides for lot range ----
        # Ensure lot_range exists
        lot_range = settings.setdefault("lot_range", {})
    
        if getattr(args, "start_lot", None) is not None:
            lot_range["start"] = int(args.start_lot)
        if getattr(args, "end_lot", None) is not None:
            lot_range["end"] = int(args.end_lot)
    
        # Validate (reviewer asked for >10000 and start < end)
        start = int(lot_range.get("start", 0))
        end = int(lot_range.get("end", 0))
    
        if start <= 10000 or end <= 10000 or start >= end:
            logging.error(
                "Invalid lot range: start=%s end=%s (must be >10000 and start < end)",
                start, end
            )
            return

        web_handler = MontrealRoleEvaluationWebHandler(settings)
        parser_instance = MontrealRoleEvaluationParser(settings)

    except (FileNotFoundError, ValueError) as e:
        logging.error(f"Configuration error: {e}")
        return

    # Run the scraper asynchronously.
    documents = asyncio.run(run_scraper(web_handler, parser_instance))

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
