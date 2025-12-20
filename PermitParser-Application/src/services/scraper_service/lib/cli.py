"""
Shared CLI argument parsing for all scrapers.
Import this to get consistent --output flags across all scrapers.
"""
import argparse


def get_scraper_parser(description: str = "Municipal scraper") -> argparse.ArgumentParser:
    """
    Create standard argument parser for scrapers.
    
    Args:
        description: Description for the scraper
        
    Returns:
        ArgumentParser with standard flags
    """
    parser = argparse.ArgumentParser(
        description=description,
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # Print to console (default)
  python -m scrapers.laval.council.main
  
  # Save to local file
  python -m scrapers.laval.council.main --output FILE
  
  # Upload raw PDFs to GCS
  python -m scrapers.laval.council.main --output GCS

Output locations:
  STDOUT: Prints JSONL to console
  FILE:   Saves to ./data/municipality/scraper_name/scraper_YYYY-MM-DD.jsonl
  GCS:    Uploads to Google Cloud Storage (see lib.storage.gcs)
        """
    )
    
    parser.add_argument(
        '--output', '--out',
        dest='output',
        type=str,
        choices=['STDOUT', 'FILE', 'GCS'],
        default='STDOUT',
        help='Output destination: STDOUT (console), FILE (save to ./data), or GCS (upload to Google Cloud Storage). Default: STDOUT'
    )

    
    return parser
