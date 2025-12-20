"""
Metadata-only relevance filter.

This module checks filenames, URLs, and documentType to decide if a
document is likely construction-related. It does not read PDF content.
Used as a fast, low-cost prefilter before full decomposition.
"""

import logging
import yaml
from pathlib import Path
from typing import Dict, List, Optional, Any
from enum import Enum
import os
import copy

import re
import unicodedata
from uuid import UUID

from google.cloud import firestore
from src.models.RawDocument.raw_document import RawDocument
from src.models.RawDocument.enums import DocumentType

def _enum_value(x):
    # returns the enum's value if it's an Enum, otherwise the string itself
    return x.value if isinstance(x, Enum) or hasattr(x, "value") else x

logger = logging.getLogger(__name__)


class FilterResult:
    
    def __init__(
        self,
        is_relevant: bool,
        reason: str,
        matched_keywords: List[str],
        municipality: str,
        exclusion_matches: Optional[List[str]] = None,
        construction_matches: Optional[List[str]] = None
    ):
        self.is_relevant = is_relevant
        self.reason = reason
        self.matched_keywords = matched_keywords
        self.exclusion_matches = exclusion_matches or []
        self.construction_matches = construction_matches or []
        self.municipality = municipality
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert FilterResult to dictionary for logging/serialization."""
        return {
            "is_relevant": self.is_relevant,
            "reason": self.reason,
            "matched_keywords": self.matched_keywords,
            "exclusion_matches": self.exclusion_matches,
            "construction_matches": self.construction_matches,
            "municipality": self.municipality
        }


class FilterConfigError(Exception):
    """Raised when filter configuration is invalid."""
    pass


class RelevanceFilterConfig:
    
    def __init__(self, config_path: Optional[Path] = None):
       
        if config_path is None:
            # Use relative path from this module
            config_path = Path(__file__).parent / "filters.yaml"
        
        # Support environment variable override
        env_config_path = os.getenv("FILTERS_CONFIG_PATH")
        if env_config_path:
            config_path = Path(env_config_path)
        
        self.config_path = config_path


        self._config: Dict[str, Any] = {}
        self._load_config()
        self._validate_config()


    
    def _load_config(self) -> None:
        """Load configuration from YAML file."""
        try:
            if not self.config_path.exists():
                raise FilterConfigError(
                    f"Filter configuration file not found: {self.config_path}"
                )
            
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self._config = yaml.safe_load(f)
            
            if self._config is None:
                raise FilterConfigError(
                    f"Filter configuration file is empty: {self.config_path}"
                )
            
            logger.info(f"Successfully loaded filter configuration from {self.config_path}")
        
        except yaml.YAMLError as e:
            raise FilterConfigError(
                f"Invalid YAML in filter configuration file {self.config_path}: {e}"
            )
        except Exception as e:
            raise FilterConfigError(
                f"Error loading filter configuration from {self.config_path}: {e}"
            )

    def _validate_config(self) -> None:
        """Validate configuration structure and content."""
        errors: List[str] = []
        
        # Check for default section
        if 'default' not in self._config:
            errors.append("Missing 'default' section in configuration")
            raise FilterConfigError(f"Configuration validation failed: {', '.join(errors)}")
        
        default = self._config['default']
        
        # Validate default construction_keywords
        if 'construction_keywords' not in default:
            errors.append("Missing 'construction_keywords' in default section")
        else:
            const_kw = default['construction_keywords']
            if not isinstance(const_kw, dict):
                errors.append("'construction_keywords' must be a dictionary with 'en' and 'fr' keys")
            else:
                for lang in ['en', 'fr']:
                    if lang not in const_kw:
                        errors.append(f"Missing '{lang}' in construction_keywords")
                    elif not isinstance(const_kw[lang], list) or len(const_kw[lang]) == 0:
                        errors.append(f"construction_keywords.{lang} must be a non-empty list")
        
        # Validate default exclusion_keywords
        if 'exclusion_keywords' not in default:
            errors.append("Missing 'exclusion_keywords' in default section")
        else:
            excl_kw = default['exclusion_keywords']
            if not isinstance(excl_kw, dict):
                errors.append("'exclusion_keywords' must be a dictionary with 'en' and 'fr' keys")
            else:
                for lang in ['en', 'fr']:
                    if lang not in excl_kw:
                        errors.append(f"Missing '{lang}' in exclusion_keywords")
                    elif not isinstance(excl_kw[lang], list) or len(excl_kw[lang]) == 0:
                        errors.append(f"exclusion_keywords.{lang} must be a non-empty list")
        
        # Validate min_construction_matches
        if 'min_construction_matches' not in default:
            errors.append("Missing 'min_construction_matches' in default section")
        elif not isinstance(default['min_construction_matches'], int) or default['min_construction_matches'] < 1:
            errors.append("'min_construction_matches' must be a positive integer")
        
        # Validate municipalities section if present
        if 'municipalities' in self._config:
            if not isinstance(self._config['municipalities'], dict):
                errors.append("'municipalities' section must be a dictionary")
            else:
                for municipality, config in self._config['municipalities'].items():
                    if not isinstance(config, dict):
                        errors.append(f"Municipality '{municipality}' configuration must be a dictionary")
                    else:
                        # Validate municipality-specific keywords (same structure as default)
                        for kw_type in ['construction_keywords', 'exclusion_keywords']:
                            if kw_type in config:
                                if not isinstance(config[kw_type], dict):
                                    errors.append(f"Municipality '{municipality}'.{kw_type} must be a dictionary")
                                else:
                                    for lang in ['en', 'fr']:
                                        if lang in config[kw_type]:
                                            if not isinstance(config[kw_type][lang], list):
                                                errors.append(
                                                    f"Municipality '{municipality}'.{kw_type}.{lang} must be a list"
                                                )
                        
                        # Validate municipality-specific threshold
                        if 'min_construction_matches' in config:
                            if not isinstance(config['min_construction_matches'], int) or config['min_construction_matches'] < 1:
                                errors.append(
                                    f"Municipality '{municipality}'.min_construction_matches must be a positive integer"
                                )
        
        if errors:
            raise FilterConfigError(f"Configuration validation failed: {'; '.join(errors)}")
        
        logger.info("Filter configuration validated successfully")
    
    def get_filter_config(self, municipality: str) -> Dict[str, Any]:
     
        # Normalize municipality name
        municipality_key = municipality.lower().strip()
        
        # Start with default configuration
        config = {
            'construction_keywords': copy.deepcopy(self._config['default']['construction_keywords']),
            'exclusion_keywords': copy.deepcopy(self._config['default']['exclusion_keywords']),
            'min_construction_matches': self._config['default']['min_construction_matches']
        }
        
        # Merge municipality-specific overrides if they exist
        if 'municipalities' in self._config and municipality_key in self._config['municipalities']:
            municipality_config = self._config['municipalities'][municipality_key]
            
            # Merge construction keywords
            if 'construction_keywords' in municipality_config:
                for lang in ['en', 'fr']:
                    if lang in municipality_config['construction_keywords']:
                        # Merge lists (municipality-specific keywords are added)
                        existing = set(config['construction_keywords'].get(lang, []))
                        new = set(municipality_config['construction_keywords'][lang])
                        config['construction_keywords'][lang] = list(existing.union(new))
            
            # Merge exclusion keywords
            if 'exclusion_keywords' in municipality_config:
                for lang in ['en', 'fr']:
                    if lang in municipality_config['exclusion_keywords']:
                        existing = set(config['exclusion_keywords'].get(lang, []))
                        new = set(municipality_config['exclusion_keywords'][lang])
                        config['exclusion_keywords'][lang] = list(existing.union(new))
            
            # Override threshold if specified
            if 'min_construction_matches' in municipality_config:
                config['min_construction_matches'] = municipality_config['min_construction_matches']
            
            logger.debug(f"Using municipality-specific configuration for '{municipality_key}'")
        else:
            logger.debug(f"Using default configuration for municipality '{municipality_key}'")
        
        return config


# Global filter config singleton cache 
# (shared filter config instance loaded once at module import)
_filter_config: Optional[RelevanceFilterConfig] = None


def get_filter_config(municipality: str) -> Dict[str, Any]:
   
    global _filter_config
    
    if _filter_config is None:
        _filter_config = RelevanceFilterConfig()
    
    return _filter_config.get_filter_config(municipality)


# Filter Logic Architecture

# helper method for match_keyword_in_text method
def extract_searchable_text(raw_document: RawDocument) -> str:
    """
    Extracts and normalizes text from document metadata fields to create a
    single searchable string.
    """
    searchable_parts = []
    
    # Add document type
    if raw_document.documentType:
        searchable_parts.append(str(_enum_value(raw_document.documentType)))
    
    # Add source URL
    if raw_document.sourceUrl:
        searchable_parts.append(raw_document.sourceUrl)
    
    # Extract filename and path from GCS URI
    if raw_document.rawDataGcsUri:
        try:
            gcs_path = raw_document.rawDataGcsUri.replace("gs://", "")
            if "/" in gcs_path:
                path_parts = gcs_path.split("/", 1)
                if len(path_parts) > 1:
                    file_path = path_parts[1]
                    searchable_parts.append(file_path)
        except Exception as e:
            logger.debug(f"Error processing GCS URI: {e}")
    
    # Combine and normalize all parts
    combined_text = " ".join(searchable_parts)
    
    return normalize_text(combined_text)


def normalize_text(text: str) -> str:
    """
    Converts text to a normalized form for comparison.

    This involves converting to lowercase, removing diacritical marks
    (accents), and standardizing separators (hyphens, underscores, etc.)
    to a single space.
    """
    if not isinstance(text, str):
        return ""

    # Step 1: Decompose characters to remove accents.
    no_accents = "".join(
        char for char in unicodedata.normalize('NFD', text.lower())
        if unicodedata.category(char) != 'Mn'
    )

    # Step 2: Replace one or more separator characters with a single space.
    standardized_separators = re.sub(r'[\s_—-]+', ' ', no_accents)

    # Step 3: Trim leading/trailing whitespace that may result.
    return standardized_separators.strip()

def match_keyword_in_text(keyword: str, text: str, use_word_boundaries: bool = True) -> bool:
    """
    Checks if a keyword is present in a text string. Normalization is
    handled prior to comparison.
    """
    if not keyword or not text:
        return False

    normalized_keyword = normalize_text(keyword)
    normalized_text = normalize_text(text)

    if use_word_boundaries:
        # The keyword is now a simple string with standard spaces.
        # Escape it for safe use in regex.
        pattern_keyword = re.escape(normalized_keyword)

        # Strict pattern: requires word boundaries.
        strict_pattern = r'\b' + pattern_keyword + r'\b'
        if re.search(strict_pattern, normalized_text, re.IGNORECASE):
            return True

        # Relaxed fallback for cases like "plan2024.pdf".
        relaxed_pattern = r'(?<![a-zA-Z])' + pattern_keyword + r'(?![a-zA-Z])'
        return bool(re.search(relaxed_pattern, normalized_text, re.IGNORECASE))
    else:
        # Simple substring search.
        return normalized_keyword in normalized_text

def find_keyword_matches(keywords: List[str], text: str) -> List[str]:
    """
    Finds which keywords from a list are present in a given text using a
    single-pass regular expression search.
    """
    if not keywords or not text:
        return []
    
    # Normalize the input text once
    normalized_text = normalize_text(text)
    
    keyword_patterns = {}
    for keyword in keywords:
        # Normalization standardizes separators in the keyword.
        normalized_keyword = normalize_text(keyword)
        
        # The pattern is now much simpler.
        escaped_keyword = re.escape(normalized_keyword)
        final_pattern = r'(?<![a-zA-Z])' + escaped_keyword + r'(?![a-zA-Z])'
        keyword_patterns[final_pattern] = keyword

    combined_pattern = re.compile("|".join(keyword_patterns.keys()), re.IGNORECASE)

    found_matches = set()
    for match in combined_pattern.finditer(normalized_text):
        matched_pattern = next(
            (p for p in keyword_patterns if re.fullmatch(p, match.group(0), re.IGNORECASE)),
            None
        )
        if matched_pattern:
            found_matches.add(keyword_patterns[matched_pattern])
            
    return list(found_matches)
# helper method for check_document_relevance method
def is_likely_relevant_document_type(document_type: DocumentType) -> bool:
    
    # These document types are more likely to be construction-related
    likely_relevant_types = {
        DocumentType.PERMIT,
        DocumentType.PLAN,
        DocumentType.APPROVAL
    }
    
    return document_type in likely_relevant_types

# helper method for check_relevance method
def fetch_raw_document_metadata(
    document_id: UUID,
    firestore_client: firestore.Client
) -> Optional[RawDocument]:
    
    try:
        raw_doc_ref = firestore_client.collection('raw_documents').document(str(document_id))
        raw_doc_snapshot = raw_doc_ref.get()
        
        if not raw_doc_snapshot.exists:
            return None
        
        raw_document_data = raw_doc_snapshot.to_dict()
        raw_document = RawDocument(**raw_document_data)
        
        return raw_document
    
    except Exception as e:
        logger.error(f"Error fetching RawDocument metadata from Firestore: {e}")
        raise

def check_document_relevance(
    raw_document: RawDocument,
    filter_config: Dict[str, Any]
) -> FilterResult:
   
    municipality = raw_document.municipality
    document_type = raw_document.documentType
    
    # Extract searchable text from document metadata
    searchable_text = extract_searchable_text(raw_document)
    
    # Get keyword lists from config
    construction_keywords_en = filter_config['construction_keywords'].get('en', [])
    construction_keywords_fr = filter_config['construction_keywords'].get('fr', [])
    exclusion_keywords_en = filter_config['exclusion_keywords'].get('en', [])
    exclusion_keywords_fr = filter_config['exclusion_keywords'].get('fr', [])
    min_construction_matches = filter_config.get('min_construction_matches', 1)
    
    # Combine all keywords (EN and FR)
    all_construction_keywords = construction_keywords_en + construction_keywords_fr
    all_exclusion_keywords = exclusion_keywords_en + exclusion_keywords_fr
    
    # Quick pre-filter to Check DocumentType enum
    # This is a fast check that can quickly identify likely relevant documents
    is_likely_relevant_type = is_likely_relevant_document_type(document_type)
    
    # Check exclusion keywords first (highest priority)
    # If any exclusion keyword matches, skip immediately (high precision)
    exclusion_matches = find_keyword_matches(all_exclusion_keywords, searchable_text)
    
    if exclusion_matches:
        return FilterResult(
            is_relevant=False,
            reason="exclusion_keywords",
            matched_keywords=exclusion_matches,
            municipality=municipality,
            exclusion_matches=exclusion_matches,
            construction_matches=[]
        )
    
    # Check construction keywords
    construction_matches = find_keyword_matches(all_construction_keywords, searchable_text)
    
    # Apply threshold logic
    if len(construction_matches) >= min_construction_matches:
        # Document meets threshold - process it
        reason = "construction_keywords_met_threshold"
        if is_likely_relevant_type:
            reason = f"{reason}_and_relevant_document_type"
        
        return FilterResult(
            is_relevant=True,
            reason=reason,
            matched_keywords=construction_matches,
            municipality=municipality,
            exclusion_matches=[],
            construction_matches=construction_matches
        )
    else:
        # Insufficient keyword matches - skip
        return FilterResult(
            is_relevant=False,
            reason="insufficient_keywords",
            matched_keywords=construction_matches,
            municipality=municipality,
            exclusion_matches=[],
            construction_matches=construction_matches
        )


class RelevanceFilter:
   
    def __init__(self, config_path: Optional[Path] = None):
        self._config = RelevanceFilterConfig(config_path)
        logger.info("RelevanceFilter initialized")
    
    def check_relevance(
        self,
        document_id: UUID,
        municipality: str,
        firestore_client: firestore.Client
    ) -> FilterResult:
        
        # Get filter configuration for municipality
        filter_config = self._config.get_filter_config(municipality)
        
        # Fetch document metadata from Firestore (lightweight read)
        raw_document = fetch_raw_document_metadata(document_id, firestore_client)
        
        if raw_document is None:
            # Document doesn't exist - this is not a filter issue
            raise ValueError(f"RawDocument {document_id} not found in Firestore")
        
        # Check document relevance
        result = check_document_relevance(raw_document, filter_config)
        
        return result


# Global RelevanceFilter singleton cache 
# (shared RelevanceFilter instance loaded once at module import)
_relevance_filter: Optional[RelevanceFilter] = None

def get_relevance_filter(config_path: Optional[Path] = None) -> RelevanceFilter:
    global _relevance_filter
    
    if _relevance_filter is None:
        _relevance_filter = RelevanceFilter(config_path)
    
    return _relevance_filter