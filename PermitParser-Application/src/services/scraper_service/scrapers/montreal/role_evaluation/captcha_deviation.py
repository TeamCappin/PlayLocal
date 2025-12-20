"""Helper utilities for detecting and handling CAPTCHA checkpoints.

This module centralises the detection of reCAPTCHA (v2) challenges and
provides a best‑effort mechanism to wait for the hidden token that
indicates a solved challenge. Separating this logic into its own
module allows the main :mod:`web_handler` to remain focused on page
navigation and scraping logic.

The functions defined here operate on Playwright ``Page`` or ``Frame``
objects (collectively referred to as ``PageLike``), and are intended
to be used by higher‑level components. They are stateless and
side‑effect free except for optional logging via a provided callback.
"""

from __future__ import annotations

import asyncio
import time
from typing import Callable, Optional, Union

from playwright.async_api import Page, Frame  # type: ignore

# A ``PageLike`` can be either a page or a frame. Frames expose most
# of the same methods as pages (such as ``locator`` and ``frames``).
PageLike = Union[Page, Frame]


# Locators used to detect reCAPTCHA frames and the hidden response
# element where the token is written after a user (or solver)
# completes the challenge. These are mirrored from the original
# implementation but live here to avoid duplication across modules.
RECAPTCHA_IFRAME_SELECTOR = (
    "iframe[src*='recaptcha'], iframe[title*='recaptcha' i], "
    "iframe[src*='enterprise/anchor'], iframe[src*='enterprise/bframe']"
)

RECAPTCHA_TOKEN_SELECTOR = (
    "textarea[name^='g-recaptcha-response'], input[name^='g-recaptcha-response']"
)

async def recaptcha_present(ctx: PageLike) -> bool:
    """Return ``True`` if a reCAPTCHA widget appears to be present.

    The heuristic checks for nested frames whose URL contains
    "recaptcha" and falls back to a direct selector query on the
    current page or frame for known reCAPTCHA iframes. Any errors
    encountered are swallowed and will result in ``False``.

    Args:
        ctx: A Playwright ``Page`` or ``Frame``.

    Returns:
        ``True`` if a reCAPTCHA iframe or frame is detected,
        otherwise ``False``.
    """
    try:
        # First inspect sub‑frames for a known reCAPTCHA URL marker.
        page = ctx.page if isinstance(ctx, Frame) else ctx
        for f in page.frames:
            try:
                if "recaptcha" in (f.url or ""):
                    return True
            except Exception:
                # Ignore frames that cannot be accessed
                pass
        # Fallback: query the DOM for iframes with recaptcha hints
        if await ctx.locator(RECAPTCHA_IFRAME_SELECTOR).count() > 0:
            return True
    except Exception:
        pass
    return False


async def wait_for_recaptcha_token(
    ctx: PageLike,
    max_wait_s: float = 5.0,
    *,
    log_func: Optional[Callable[..., None]] = None,
) -> bool:
    """Wait for the hidden reCAPTCHA token to be populated.

    After completing a reCAPTCHA challenge, a hidden input or textarea
    named ``g-recaptcha-response`` is filled with a long base64-like
    token. This function polls for the presence of that token for up
    to ``max_wait_s`` seconds. If found, it returns ``True``. If the
    element is not present or the token never appears, it returns
    ``False``.

    Logging is optional: if a ``log_func`` is provided, debug
    messages will be emitted via that callable. The signature of
    ``log_func`` should follow ``log_func(message: str, *args, **kwargs)``.

    Args:
        ctx: A Playwright ``Page`` or ``Frame``.
        max_wait_s: Maximum seconds to wait for the token.
        log_func: Optional callback for debug logging.

    Returns:
        ``True`` if a token is detected within the timeout, else
        ``False``.
    """
    try:
        sel = RECAPTCHA_TOKEN_SELECTOR
        loc = ctx.locator(sel).first
        # If the token element is absent, there's nothing to wait for
        if await loc.count() == 0:
            if log_func:
                log_func("Recaptcha token element not present (will submit anyway)")

            return False

        start = time.monotonic()
        while time.monotonic() - start < max_wait_s:
            try:
                val = await loc.input_value()
            except Exception:
                val = ""
            if val and len(val.strip()) > 0:
                # Found a non‑empty token
                if log_func:
                    log_func(f"Recaptcha token detected (length={len(val.strip())})")
                return True
            await asyncio.sleep(0.25)
        if log_func:
            log_func(f"Recaptcha token wait timed out (waited_seconds={max_wait_s})")

        # Optional small retry with exponential backoff
        for extra_wait in (2, 5):
            await asyncio.sleep(extra_wait)
            try:
                val = await loc.input_value()
                if val and len(val.strip()) > 0:
                    if log_func:
                        log_func(f"Recaptcha token detected (len={len(val.strip())})")
                    return True
            except Exception:
                pass
        return False

    except Exception as exc:
        if log_func:
            # Wrap the exception message in a debug call; avoid raising
            log_func(f"Recaptcha token wait error: {exc}")
        return False
