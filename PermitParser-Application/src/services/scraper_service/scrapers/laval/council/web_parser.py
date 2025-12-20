import logging
import hashlib
from datetime import date
from typing import Dict, List, Optional, Any
from bs4 import BeautifulSoup
from lib.abstract_scraper import AbstractParser
from urllib.parse import urljoin

class LavalCouncilParser(AbstractParser):
    """
    Specific implementation for parsing raw Laval council table row HTML.
    """
    PDF_URL_BASE = "https://www.laval.ca"

    def __init__(self):
        self.seen_urls: set[str] = set()
        self.seen_hashes: set[str] = set()
        self.parse_errors = 0
        self.skipped_invalid = 0
        self.skipped_duplicates = 0

    def _normalize_url(self, url: str) -> str:
        url = url.strip().lower()
        # Remove trailing slash
        if url.endswith('/'):
            url = url[:-1]
        return url

    def _create_row_hash(self, data: Dict[str, Any]) -> str:
        hash_string = f"{data['session_type']}|{data['meeting_date']}|{data['document_number']}|{data['document_title']}"
        return hashlib.md5(hash_string.encode()).hexdigest()

    def parse_element(self, row_html: str) -> Optional[Dict[str, Any]]:
        """
        Parse a single table row HTML string.
        Returns parsed data WITHOUT deduplication.
        
        Args:
            row_html: HTML string of a table row
            
        Returns:
            Dictionary with parsed data or None if invalid
        """
        try:
            soup = BeautifulSoup(row_html, 'html.parser')
            cells = soup.find_all('td')
            
            if len(cells) < 7:
                self.skipped_invalid += 1
                logging.debug(f"Skipping row with {len(cells)} cells (expected 7)")
                return None
            
            session_type = cells[0].get_text(strip=True)
            sub_session = cells[1].get_text(strip=True)
            meeting_type = cells[2].get_text(strip=True)
            meeting_date = cells[3].get_text(strip=True)
            document_number = cells[4].get_text(strip=True)
            document_title = cells[5].get_text(strip=True)
            
            link_elem = cells[6].find('a')
            pdf_url_path = link_elem.get('href', '') if link_elem else ""
            
            if not pdf_url_path:
                self.skipped_invalid += 1
                logging.debug(f"Skipping row without PDF URL: {document_title}")
                return None 
                
            full_pdf_url = urljoin(self.PDF_URL_BASE, pdf_url_path)
            
            doc_type = ""
            lower_title = document_title.lower()
            if "ordre" in lower_title:
                doc_type = "Ordre du jour"
            elif "procès" in lower_title or "proces" in lower_title:
                doc_type = "Procès-verbal"
            elif "sommaire" in lower_title:
                doc_type = "Sommaire décisionnel"
            elif "séance" in lower_title or "seance" in lower_title:
                doc_type = "Séance"
 
            data = {
                "session_type": session_type,
                "sub_session": sub_session,
                "meeting_type": meeting_type,
                "meeting_date": meeting_date,
                "document_number": document_number,
                "document_title": document_title,
                "document_type": doc_type,
                "pdf_url": full_pdf_url,
                "crawl_date": date.today().isoformat()
            }
            
            return data
            
        except Exception as e:
            self.parse_errors += 1
            logging.debug(f"Error parsing row: {e}")
            return None

    def parse_all(self, elements: List[str]) -> List[Dict[str, Any]]:
        """
        Parse all HTML strings with consistent deduplication.
        
        Args:
            elements: List of HTML strings
            
        Returns:
            List of unique parsed dictionaries
        """
        # Reset stats and deduplication state
        self.parse_errors = 0
        self.skipped_invalid = 0
        self.skipped_duplicates = 0
        self.seen_urls.clear()
        self.seen_hashes.clear()
        
        # FIRST PASS: Parse all rows
        all_parsed = []
        for i, html in enumerate(elements, 1):
            parsed = self.parse_element(html)
            if parsed:
                all_parsed.append(parsed)
            else:
                self.skipped_invalid += 1
        
        # SECOND PASS: Deduplicate
        results = []
        for data in all_parsed:
            normalized_url = self._normalize_url(data["pdf_url"])
            row_hash = self._create_row_hash(data)
            
            # Check for duplicates
            if normalized_url in self.seen_urls or row_hash in self.seen_hashes:
                self.skipped_duplicates += 1
                logging.debug(f"Skipping duplicate: {data['document_title']} ({normalized_url})")
                continue
            
            # Add to results and mark as seen
            self.seen_urls.add(normalized_url)
            self.seen_hashes.add(row_hash)
            results.append(data)
        
        logging.info(f"Parser Statistics:")
        logging.info(f"  └─ Total rows processed: {len(elements)}")
        logging.info(f"  └─ Successfully parsed: {len(results)}")
        logging.info(f"  └─ Skipped (invalid): {self.skipped_invalid}")
        logging.info(f"  └─ Skipped (duplicates): {self.skipped_duplicates}")
        logging.info(f"  └─ Parse errors: {self.parse_errors}")
        
        return results