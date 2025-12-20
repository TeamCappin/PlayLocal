"""
Robots.txt handling.

This module caches and evaluates robots.txt rules for hosts.  It uses
Python's `urllib.robotparser` under the hood.  Scrapers should call
`is_allowed(url)` before fetching any URL to ensure compliance with
publisher policies.
"""

from __future__ import annotations

import logging
from urllib.parse import urlparse
from urllib.robotparser import RobotFileParser
from typing import Dict

import requests

logger = logging.getLogger(__name__)


_parsers: Dict[str, RobotFileParser] = {}


def _get_parser_for(host: str) -> RobotFileParser:
    if host in _parsers:
        return _parsers[host]
    parser = RobotFileParser()
    robots_url = f"https://{host}/robots.txt"
    try:
        resp = requests.get(robots_url, timeout=10)
        if resp.status_code == 200:
            parser.parse(resp.text.splitlines())
            logger.info("Loaded robots.txt from %s", robots_url)
        else:
            logger.info("No robots.txt found at %s (status %d)", robots_url, resp.status_code)
    except Exception as exc:
        logger.warning("Could not fetch robots.txt from %s: %s", robots_url, exc)
    _parsers[host] = parser
    return parser


def is_allowed(url: str, user_agent: str = "*") -> bool:
    parsed = urlparse(url)
    parser = _get_parser_for(parsed.netloc)
    return parser.can_fetch(user_agent, url)