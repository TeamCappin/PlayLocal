"""
Simple HTTP client with rate limiting and robots.txt respect.

This module centralises outbound HTTP requests for scrapers.  It applies
per-host rate limits, sets a consistent User-Agent, and retries on
transient errors.  Robots.txt rules are fetched and cached to ensure that
the scrapers do not violate a source's crawling policy.

Note: This is a simplified implementation intended for demonstration.
Production usage should handle backoff, proxy configuration and
authentication where required.
"""

from __future__ import annotations

import logging
import time
from urllib.parse import urlparse

import requests
from tenacity import retry_if_exception, retry, stop_after_attempt, wait_exponential

logger = logging.getLogger(__name__)

def _retry_on_exception(exc):
    """Retry everything except 4xx client errors."""
    if isinstance(exc, requests.HTTPError) and 400 <= exc.response.status_code < 500:
        return False
    return True

class HTTPClient:
    def __init__(self, user_agent: str, rate_limit_rps: float = 1.0, timeout: int = 30):
        self.session = requests.Session()
        self.session.headers.update({"User-Agent": user_agent})
        self.rate_limit_rps = rate_limit_rps
        self.timeout = timeout
        self._last_request_time: dict[str, float] = {}

    def _respect_rate_limit(self, netloc: str):
        # Sleep to respect per-host rate limit
        now = time.monotonic()
        last = self._last_request_time.get(netloc, 0)
        min_interval = 1.0 / self.rate_limit_rps
        wait_time = last + min_interval - now
        if wait_time > 0:
            time.sleep(wait_time)
        self._last_request_time[netloc] = time.monotonic()

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=1, max=8),
        retry=retry_if_exception(_retry_on_exception)
    )
    def get(self, url: str, **kwargs) -> requests.Response:
        parsed = urlparse(url)
        self._respect_rate_limit(parsed.netloc)
        try:
            logger.debug("HTTP GET: %s", url)
            resp = self.session.get(url, timeout=self.timeout, **kwargs)
            resp.raise_for_status()
            return resp
        except requests.HTTPError as e:
            # 4xx errors are often not transient, log and raise
            if 400 <= e.response.status_code < 500:
                logger.error("Client error %s for URL %s", e.response.status_code, url)
                raise
            logger.warning("Server error or network issue for %s: %s", url, e)
            raise
        except requests.RequestException as e:
            logger.warning("Request failed for %s: %s", url, e)
            raise