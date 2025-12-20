"""
Master scraper entry point with dynamic scraper discovery.
Usage: python3.11 -m scrapers --municipality laval --scraper council --output FILE
       python3.11 -m scrapers --list  # Show available scrapers
"""
import sys
import argparse
import logging
from pathlib import Path
import importlib

def discover_scrapers():
    """
    Dynamically discover all available scrapers from folder structure.
    Returns: dict of {municipality: [scraper_names]}
    """
    scrapers_dir = Path(__file__).parent
    registry = {}
    
    # Iterate through municipality folders
    for muni_dir in scrapers_dir.iterdir():
        if not muni_dir.is_dir():
            continue
        if muni_dir.name.startswith('_') or muni_dir.name == '__pycache__':
            continue
        
        municipality = muni_dir.name
        scrapers = []
        
        # Iterate through scraper folders within municipality
        for scraper_dir in muni_dir.iterdir():
            if not scraper_dir.is_dir():
                continue
            if scraper_dir.name.startswith('_') or scraper_dir.name == '__pycache__':
                continue
            
            # Check if it has a main.py
            main_file = scraper_dir / 'main.py'
            if main_file.exists():
                scrapers.append(scraper_dir.name)
        
        if scrapers:
            registry[municipality] = scrapers
    
    return registry

def list_available_scrapers(registry):
    """Print all available scrapers."""
    print("\n=== Available Scrapers ===\n")
    for municipality, scrapers in sorted(registry.items()):
        print(f"- {municipality.upper()}")
        for scraper in sorted(scrapers):
            print(f"   └─ {scraper}")
        print()

def get_master_parser(registry):
    """Create argument parser for master scraper."""
    parser = argparse.ArgumentParser(
        description='Master scraper entry point for all municipalities',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python3.11 -m scrapers --municipality laval --scraper council --output FILE
  python3.11 -m scrapers --list
        """
    )
    
    parser.add_argument(
        '--list',
        action='store_true',
        help='List all available scrapers and exit'
    )
    parser.add_argument(
        '--municipality',
        type=str,
        help=f'Municipality to scrape (available: {", ".join(registry.keys())})'
    )
    parser.add_argument(
        '--scraper',
        type=str,
        help='Specific scraper to run'
    )
    parser.add_argument(
        '--output',
        choices=['STDOUT', 'FILE', 'GCS'],
        default='FILE',
        help='Output destination (default: FILE)'
    )
    
    return parser

def main():
    registry = discover_scrapers()
    
    if not registry:
        print("No scrapers found in scrapers/ directory")
        sys.exit(1)
    
    parser = get_master_parser(registry)
    args = parser.parse_args()
    
    if args.list:
        list_available_scrapers(registry)
        sys.exit(0)
    
    if not args.municipality or not args.scraper:
        parser.print_help()
        print("\n Use --list to see available scrapers")
        sys.exit(1)
    
    municipality = args.municipality.lower()
    scraper_name = args.scraper.lower()
    
    if municipality not in registry:
        print(f"\n Municipality '{municipality}' not found")
        print(f"\n💡 Available municipalities: {', '.join(registry.keys())}")
        sys.exit(1)
    
    if scraper_name not in registry[municipality]:
        print(f"\n Scraper '{scraper_name}' not found for {municipality}")
        print(f"\n💡 Available scrapers for {municipality}: {', '.join(registry[municipality])}")
        sys.exit(1)
    
    module_path = f"scrapers.{municipality}.{scraper_name}.main"
    try:
        scraper_module = importlib.import_module(module_path)
    except ImportError as e:
        print(f"\n Failed to import {module_path}: {e}")
        sys.exit(1)
    
    sys.argv = [
        sys.argv[0],
        '--output', args.output
    ]
    
    print(f" Running {municipality}/{scraper_name} scraper...\n")
    scraper_module.main()

if __name__ == '__main__':
    main()