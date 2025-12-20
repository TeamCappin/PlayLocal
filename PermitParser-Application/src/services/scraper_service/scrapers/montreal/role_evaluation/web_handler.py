# web_handler.py
"""Web handler for the Montréal role evaluation scraper:
   - Spinner-aware
   - Distinguishes empty-state vs. transient error banner
   - Recaptcha-aware (token wait) + deterministic submit order
   - Deterministic state classification with debug logs
   - Explicit 2–4s inter-lot delay
   - ≥15s wait after ANY banner; after 2 banners → new browser context + 20–30s wait
   - Cap per-lot at 3 attempts, then skip (deferred revisit)
   - Route-aware rebind: only rebind on search route, no error noise on /liste
   - Debug artifacts (screenshots/HTML/metadata)
"""

from __future__ import annotations

import asyncio
import json
import logging
import random
import re
import time
from enum import Enum
from dataclasses import dataclass
from typing import Any, Dict, List, Optional, Set, Tuple, Union
from pathlib import Path
from contextvars import ContextVar
from datetime import datetime

from playwright.async_api import async_playwright, Browser, BrowserContext, Page, Frame, Locator  # type: ignore

# Import helpers for CAPTCHA detection and token waiting.  These
# functions live in a separate module to keep bot deviation logic
# contained and reusable across different web handlers.
from .captcha_deviation import recaptcha_present, wait_for_recaptcha_token

from lib.abstract_scraper import AbstractWebHandler

PageLike = Union[Page, Frame]
logger = logging.getLogger(__name__)




# --- Lot-aware logging --------------------------------------------
# ContextVar holds the "current lot" during each loop iteration.
_current_lot: ContextVar[int | None] = ContextVar("_current_lot", default=None)

class LotAwareFormatter(logging.Formatter):
    """
    Prefixes each line with [LOT <n>] when a lot is known (either via record.lot
    or the _current_lot ContextVar). If no lot is active, no prefix is shown.
    """
    def format(self, record: logging.LogRecord) -> str:
        lot = getattr(record, "lot", None)
        if lot is None:
            try:
                lot = _current_lot.get()
            except Exception:
                lot = None
        record.lot_prefix = f"[LOT {lot}] " if lot is not None else ""
        return super().format(record)

def _upgrade_handlers(lg: logging.Logger) -> None:
    """
    Replace existing handler formatters with a LotAwareFormatter that understands
    %(lot_prefix)s. We preserve the existing format & datefmt, only injecting
    the lot prefix just before %(name)s: if possible, otherwise before %(message)s.
    """
    for h in lg.handlers:
        # Use existing formatter if present, otherwise a sane default.
        if h.formatter:
            fmt = getattr(h.formatter, "_fmt", "%(asctime)s [%(levelname)s] %(name)s: %(message)s")
            datefmt = getattr(h.formatter, "datefmt", None)
        else:
            fmt = "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            datefmt = None
        # Inject %(lot_prefix)s once.
        if "%(lot_prefix)s" not in fmt:
            if "%(name)s:" in fmt:
                fmt = fmt.replace("%(name)s:", "%(lot_prefix)s%(name)s:")
            else:
                fmt = fmt.replace("%(message)s", "%(lot_prefix)s%(message)s")
        h.setFormatter(LotAwareFormatter(fmt, datefmt))

def install_lot_prefix_formatter() -> None:
    """Upgrade both root and module logger handlers (idempotent)."""
    _upgrade_handlers(logging.getLogger())         # root
    _upgrade_handlers(logging.getLogger(__name__)) # this module
# -------------------------------------------------------------------

@dataclass
class RunStats:
    lots_total: int = 0
    lots_with_results: int = 0
    details_opened: int = 0
    banners_seen: int = 0
    soft_empty_hits: int = 0
    empty_state_hits: int = 0


class Outcome(Enum):
    FOUND_LIST = "FOUND_LIST"                 # /liste with rows (evalUnitIds present)
    FOUND_EMPTY_STATE = "FOUND_EMPTY_STATE"   # "Aucun résultat n'a été trouvé." (definitive no match)
    ERROR_BANNER = "ERROR_BANNER"             # alert-danger (transient; retryable)
    SOFT_EMPTY_LIST = "SOFT_EMPTY_LIST"       # /liste loaded but 0 rows + no empty-state (likely timing/captcha; retryable)
    FAILED_CONTEXT = "FAILED_CONTEXT"         # can't locate input/ctx
    TIMEOUT = "TIMEOUT"                       # gave up waiting for any state
    OK = "OK"                                 # generic success marker for internal steps


class MontrealRoleEvaluationWebHandler(AbstractWebHandler[List[str]]):
    # ------------------ Selectors ------------------

    OPTION_LOT_RENOVE_SELECTORS = [
        "text=/\\bPar\\s+lot\\s+rénové\\b/i",
        "text=/\\bPar\\s+lot\\s+renove\\b/i",
        "text=/\\bBy\\s+lot\\b/i",
        "label:has-text('lot rénové')",
        "label:has-text('lot renove')",
    ]
    NEXT_STEP_BUTTON_SELECTORS = [
        "button:has-text('Suivant')",
        "button:has-text('Next')",
    ]

    LOT_INPUT_CANDIDATES = [
        "input[name='lotNumber']",
        "input[aria-label*='lot' i]",
        "input[placeholder*='lot' i]",
        "input[id*='lot' i]",
        "input[name*='lot' i]",
        "input[type='search']",
        "input[type='text']",
        "input:not([type])",
    ]

    # Buttons to submit the search
    BUTTON_CANDIDATES_GLOBAL = [
        "button:has-text('Rechercher')",
        "button:has-text('Search')",
        "button[type='submit']",
        "[role='button']:has-text('Rechercher')",
        "[role='button']:has-text('Search')",
    ]

    # Loading overlay shown by the SPA
    SPINNER_SELECTOR = "[data-test='loading'][aria-busy='true'], .spinner-container[aria-busy='true']"

    # TRANSIENT error alert shown by the SPA (retryable)
    ERROR_BANNER_SELECTOR = "div[data-test='target-message'].alert-danger, .alert.alert-danger[data-test='target-message']"

    # DEFINITIVE empty result "Aucun résultat n'a été trouvé."
    EMPTY_STATE_WRAPPER = "div[data-test='important-message'].empty-state, .empty-state[data-test='important-message']"
    EMPTY_STATE_TEXT_NODE = "p[data-test='description']"
    EMPTY_STATE_BACK_LINK = "a[data-test='back'], a.btn:has-text('Nouvelle recherche')"

    # Results list (be lenient)
    RESULTS_ROOT_CANDIDATES = [
        "div[data-test='action-list']",
        "main",
        "section",
        "div[role='region']",
    ]
    RESULT_EVALUNIT_INPUT_ANY = "input[name='evalUnitId'], input[name*='evalUnitId' i]"
    RESULT_FORM_ANY = f"form:has({RESULT_EVALUNIT_INPUT_ANY})"
    RESULT_LINK_ANY = "a[href*='/role-evaluation-fonciere/lot-renove/liste/resultat'], a[href*='evalUnitId=']"

    NEXT_PAGE_SELECTOR = (
        'a[aria-label="Suivant"], a[aria-label="Next"], '
        'button[aria-label="Suivant"], button[aria-label="Next"]'
    )
    DETAIL_HEADING_SELECTOR = 'h1:has-text("Extrait du rôle"), h1:has-text("extract")'

    from .captcha_deviation import (
     RECAPTCHA_IFRAME_SELECTOR,
     RECAPTCHA_TOKEN_SELECTOR,
 )

    # ------------------ Init ------------------

    def __init__(self, settings: Dict[str, Any]) -> None:
        self.base_url: str = settings.get("base_url", "https://montreal.ca")
        self.start_url_path: str = settings.get("start_url_path", "/role-evaluation-fonciere")
        self.headless: bool = bool(settings.get("headless", True))
        self.timeout: int = int(settings.get("timeout_ms", 60000))

        lot_range: Dict[str, Any] = settings.get("lot_range", {})
        try:
            self.start_lot = int(lot_range["start"])
            self.end_lot = int(lot_range["end"])
        except Exception as exc:
            raise ValueError(
                f"Missing or invalid lot_range in settings: {lot_range!r}"
            ) from exc
      
        if self.start_lot <= 10000 or self.end_lot <= 10000 or self.start_lot >= self.end_lot:
            raise ValueError(
                f"Invalid lot range: start={self.start_lot} end={self.end_lot} "
                f"(must be >10000 and start < end)"
            )


        wait_cfg: Dict[str, Any] = settings.get("wait", {})
        self.wait_table_ms: int = int(wait_cfg.get("table_ms", 30000))

        # Inter-lot delay (seconds) is configurable; default to 2.0–4.0
        inter_lot = wait_cfg.get("inter_lot_range_s", (2.0, 4.0))
        try:
            lo, hi = float(inter_lot[0]), float(inter_lot[1])  # type: ignore[index]
            if not (0.0 <= lo < hi):
                lo, hi = 2.0, 4.0
        except Exception:
            lo, hi = 2.0, 4.0
        self.inter_lot_range: Tuple[float, float] = (lo, hi)


        # Cap per-lot attempts at 3 (exactly as requested)
        self.max_lot_attempts: int = 3

        # Adaptive cooldown knobs (remain available for streaks)
        cool_cfg: Dict[str, Any] = settings.get("cooldown", {}) or {}
        self.banner_streak_threshold: int = int(cool_cfg.get("banners_threshold", 3))
        self.banner_cooldown_range: Tuple[float, float] = tuple(cool_cfg.get("banners_sleep_range_s", (6.0, 10.0)))  # type: ignore
        self.soft_empty_streak_threshold: int = int(cool_cfg.get("soft_empty_threshold", 2))
        self.soft_empty_cooldown_range: Tuple[float, float] = tuple(cool_cfg.get("soft_empty_sleep_range_s", (4.0, 7.0)))  # type: ignore
        self.reload_on_cooldown: bool = bool(cool_cfg.get("reload_page", True))

        # Configurable waits after transient banners / context recreation
        self.banner_wait_range: Tuple[float, float] = tuple(
            cool_cfg.get("banner_wait_range_s", (15.0, 20.0))
        )  # type: ignore
        self.post_recreate_wait_range: Tuple[float, float] = tuple(
            cool_cfg.get("post_recreate_wait_range_s", (20.0, 30.0))
        )  # type: ignore


        # Optional same-context new-tab recovery toggle (kept but de-emphasized)
        self.recover_with_new_tab: bool = bool(settings.get("recover_with_new_tab", True))

        # Debug artifact knobs
        dbg: Dict[str, Any] = settings.get("debug", {}) or {}
        self.debug_artifacts_dir: Optional[Path] = Path(dbg.get("artifacts_dir")).expanduser() if dbg.get("artifacts_dir") else None
        self.debug_capture_html: bool = bool(dbg.get("capture_html", True))
        self.debug_capture_screens: bool = bool(dbg.get("capture_screens", True))
        self.debug_max_artifacts: int = int(dbg.get("max_artifacts", 300))
        self._artifact_count: int = 0

        # Streaks & simple run stats
        self.consecutive_banners: int = 0
        self.consecutive_soft_empty: int = 0
        self.stats: Dict[str, int] = {
            "banners": 0,
            "soft_empty": 0,
            "empty_state": 0,
            "found_list": 0,
            "timeouts": 0,
            "failed_context": 0,
            "lots_processed": 0,
            "lots_skipped": 0,
        }

        self.visited_details: Set[str] = set()
        self.visited_eval_ids: Set[str] = set()
        # Track occurrences of each evaluation unit ID. When the same
        # evalUnitId appears multiple times on a results page (true
        # duplicates), this counter lets us assign a distinct index to
        # each occurrence.  The first appearance has index 1, the
        # second index 2, etc.  The index is injected into the
        # metadata so the parser can construct unique record IDs.
        self.eval_id_counter: Dict[str, int] = {}
        self.skipped_lots: List[int] = []

        self.search_ctx: Optional[PageLike] = None
        self._browser: Optional[Browser] = None  # used to recreate contexts

        



    # ------------------ Main ------------------

    async def fetch_rows(self) -> List[str]:
        collected_html: List[str] = []
        # Enable lot-aware prefixing on all handlers before we start logging.
        install_lot_prefix_formatter()
        logger.info("Starting Web Handler...", extra={"headless": self.headless, "base_url": self.base_url})
        t0 = time.monotonic()
        run_stats = RunStats(lots_total=(self.end_lot - self.start_lot + 1))

        async with async_playwright() as pw:
            browser: Browser = await pw.chromium.launch(headless=self.headless)
            self._browser = browser
            context: BrowserContext = await browser.new_context()
            page: Page = await context.new_page()

            entry = f"{self.base_url}{self.start_url_path}"
            logger.info("Navigating to landing page", extra={"url": entry})
            await page.goto(entry, wait_until="domcontentloaded", timeout=self.timeout)

            prepared = await self._prepare_search_form(page)
            if not prepared:
                logger.error("Could not prepare search form")
                await browser.close()
                return collected_html

            assert self.search_ctx is not None
            logger.info("Search form prepared", extra={"page_url": page.url, "ctx_url": self._ctx_url(self.search_ctx)})

            for lot_num in range(self.start_lot, self.end_lot + 1):
                # Make the current lot visible to the formatter for all nested logs.
                _token = _current_lot.set(lot_num)
                try:
                    # Inter-lot delay (configurable; default 2–4s)
                    delay = round(random.uniform(*self.inter_lot_range), 2)
                    logger.info("Inter-lot delay", extra={"seconds": delay, "next_lot": lot_num})
                    await asyncio.sleep(delay)

                    lot_htmls, page = await self._process_lot(page, lot_num, run_stats)
                    collected_html.extend(lot_htmls)
                    self.stats["lots_processed"] += 1
                finally:
                    # Ensure the lot prefix doesn’t leak to the next iteration.
                    _current_lot.reset(_token)

            await browser.close()


        stats_block = (
            "Parse Statistics:\n"
            f"├ Total lots attempted: {run_stats.lots_total}\n"
            f"├ Lots with results: {run_stats.lots_with_results}\n"
            f"├ Details opened: {run_stats.details_opened}\n"
            f"├ Banners (transient): {run_stats.banners_seen}\n"
            f"├ Soft empty hits: {run_stats.soft_empty_hits}\n"
            f"└ Empty-state hits: {run_stats.empty_state_hits}"
        )
        logger.info(stats_block)

        logger.info("Finished Web Handler", extra={"seconds": round(time.monotonic() - t0, 2), "records": len(collected_html)})
        logger.info("Run stats", extra={**self.stats, "skipped_lots": self.skipped_lots})
        await self._dump_summary()
        return collected_html

    # ------------------ Prepare & rebind ------------------

    async def _prepare_search_form(self, page: Page) -> bool:
        logger.info("Preparing search via stepper path")

        # Click "Par lot rénové"
        ok = False
        for sel in self.OPTION_LOT_RENOVE_SELECTORS:
            try:
                logger.info("Trying to click lot-renové option", extra={"selector": sel})
                await page.click(sel, timeout=4000)
                ok = True
                break
            except Exception as exc:
                logger.debug("Option click failed", extra={"selector": sel, "error": str(exc)})
        if not ok:
            return False

        # Click "Suivant"
        ok = False
        for sel in self.NEXT_STEP_BUTTON_SELECTORS:
            try:
                logger.info("Clicking stepper next", extra={"selector": sel})
                await page.click(sel, timeout=4000)
                ok = True
                break
            except Exception as exc:
                logger.debug("Next click failed", extra={"selector": sel, "error": str(exc)})
        if not ok:
            return False

        await page.wait_for_load_state("domcontentloaded")
        await asyncio.sleep(0.2)
        return await self._rebind_search_ctx(page)

    async def _ensure_on_search_route(self, page: Page) -> None:
        """Make sure we are on the /lot-renove route, not the generic landing page."""
        try:
            if "/role-evaluation-fonciere/lot-renove" not in page.url:
                logger.info("Ensuring search route", extra={"from_url": page.url})
                await page.goto(f"{self.base_url}/role-evaluation-fonciere/lot-renove",
                                wait_until="domcontentloaded", timeout=self.timeout)
                await asyncio.sleep(0.2)
        except Exception as exc:
            logger.debug("Ensure search route failed", extra={"error": str(exc)})

    async def _rebind_search_ctx(self, page: Page) -> bool:
        """Only rebind on the search route; do not call this from /liste."""
        await self._ensure_on_search_route(page)
        logger.info("Rebinding search context (post-nav)")
        return await self._discover_search_ctx(page)

    async def _discover_search_ctx(self, page: Page) -> bool:
        # Guard: if we somehow are on /liste, don't emit scary errors
        if "/lot-renove/liste" in (page.url or ""):
            logger.debug("On list route; skipping search ctx discovery", extra={"url": page.url})
            return False

        frames = page.frames
        logger.info("Enumerating frames", extra={"count": len(frames), "frames": [self._frame_info(f) for f in frames]})

        candidates: List[PageLike] = [page.main_frame] + [f for f in frames if f is not page.main_frame]
        for ctx in candidates:
            inp = await self._find_visible_lot_input(ctx)
            if inp is not None:
                self.search_ctx = ctx
                inputs = await self._count(ctx, "input")
                buttons = await self._count(ctx, "button")
                logger.info("Search context selected", extra={"ctx_url": self._ctx_url(ctx), "inputs": inputs, "buttons": buttons})
                return True

        logger.warning("No lot input found while on search route")
        await self._dump_debug(page, "no_lot_input_discover", extra={"url": page.url})
        return False

    async def _find_visible_lot_input(self, ctx: PageLike) -> Optional[Locator]:
        for sel in self.LOT_INPUT_CANDIDATES:
            try:
                loc = ctx.locator(sel).first
                if await loc.is_visible():
                    if await loc.is_disabled():
                        continue
                    ro = await loc.get_attribute("readonly")
                    if ro:
                        continue
                    logger.info("Lot input candidate visible", extra={"selector": sel, "ctx_url": self._ctx_url(ctx)})
                    return loc
            except Exception:
                continue
        return None

    # ------------------ Submit & classify ------------------

    async def _submit_lot_search(self, ctx: PageLike, lot_num: int) -> Outcome:
        """Attempt to submit a lot search once; returns a classified Outcome."""
        await self._wait_spinner_gone(ctx)

        input_loc = await self._find_visible_lot_input(ctx)
        if input_loc is None:
            # Already on list?
            if "/lot-renove/liste" in self._ctx_url(ctx):
                logger.info("No input but already on list route; treating as FOUND_LIST")
                return Outcome.FOUND_LIST
            logger.warning("No lot input visible in ctx")
            return Outcome.FAILED_CONTEXT

        # Deterministic typing (with small human-like delay)
        try:
            await input_loc.click(timeout=10000)
            await input_loc.fill("")
            await input_loc.fill(str(lot_num))
            await asyncio.sleep(random.uniform(0.15, 0.35))
            try:
                await input_loc.press("Tab")
            except Exception:
                pass
            logger.info("Filled lot number", extra={"lot": lot_num})
        except Exception as exc:
            logger.debug("Typing into lot input failed", extra={"error": str(exc)})
            return Outcome.FAILED_CONTEXT

        # If recaptcha exists, wait briefly for a token to appear before submit
        token_ready = False
        if await self._recaptcha_present(ctx):
            jitter = random.uniform(0.4, 1.2)
            logger.debug("Recaptcha frame present; adding jitter before submit", extra={"jitter_seconds": round(jitter, 2)})
            await asyncio.sleep(jitter)
            token_ready = await self._wait_for_recaptcha_token(ctx, max_wait_s=5.0)
            logger.debug("Recaptcha token status pre-submit", extra={"ready": token_ready})

        # Submission order (fixed): Enter → nearest button → global button (last)
        submitted = False

        # 1) Enter
        try:
            await input_loc.press("Enter")
            logger.info("Submitted via Enter")
            submitted = True
        except Exception as exc:
            logger.debug("Enter submit failed", extra={"error": str(exc)})

        # 2) Nearest (if Enter didn't submit)
        if not submitted and await self._click_nearest_submit(ctx, input_loc):
            logger.info("Submitted via form-nearest button")
            submitted = True

        # 3) Global (last resort)
        if not submitted and await self._click_global_submit(ctx):
            logger.info("Submitted via global button (last resort)")
            submitted = True

        if not submitted:
            logger.warning("No submit control could be activated")
            return Outcome.FAILED_CONTEXT

        # Wait for spinner & classify
        await self._wait_spinner_cycle(ctx)
        outcome = await self._classify_state_post_submit(ctx)
        return outcome

    async def _click_nearest_submit(self, ctx: PageLike, input_loc: Locator) -> bool:
        """Click a submit button inside the same form/group as the input."""
        # 1) Try the form ancestor
        try:
            form_btn = input_loc.locator("xpath=ancestor::form[1]//button[@type='submit' or contains(., 'Rechercher') or contains(., 'Search')]").first
            if await form_btn.count() > 0 and await form_btn.is_visible():
                await form_btn.click()
                return True
        except Exception:
            pass
        # 2) Try sibling/nearby button in the same container line
        try:
            near_btn = input_loc.locator("xpath=ancestor::*[self::div or self::section][1]//button[contains(., 'Rechercher') or contains(., 'Search') or @type='submit']").first
            if await near_btn.count() > 0 and await near_btn.is_visible():
                await near_btn.click()
                return True
        except Exception:
            pass
        return False

    async def _click_global_submit(self, ctx: PageLike) -> bool:
        for bsel in self.BUTTON_CANDIDATES_GLOBAL:
            try:
                btn = ctx.locator(bsel).first
                if await btn.is_visible():
                    await btn.click()
                    return True
            except Exception:
                continue
        return False

    async def _classify_state_post_submit(self, ctx: PageLike) -> Outcome:
        """Classify post-submit UI into a deterministic outcome."""
        page = ctx.page if isinstance(ctx, Frame) else ctx
        deadline = time.monotonic() + (self.wait_table_ms / 1000.0)
        soft_empty_grace = 2.5
        soft_empty_deadline = time.monotonic() + soft_empty_grace

        while time.monotonic() < deadline:
            url = page.url

            # 1) Empty-state (definitive NO MATCH)
            if await self._check_empty_state(ctx):
                logger.info("Empty-state detected (Aucun résultat).")
                return Outcome.FOUND_EMPTY_STATE

            # 2) Results present
            if "/lot-renove/liste" in url:
                if await self._has_any_results(ctx):
                    logger.info("Results detected by route+rows", extra={"url": url})
                    return Outcome.FOUND_LIST
                if time.monotonic() > soft_empty_deadline:
                    logger.info("List route with 0 rows and no empty-state → soft empty", extra={"url": url})
                    return Outcome.SOFT_EMPTY_LIST

            # 3) Rows without route change (rare)
            if await self._has_any_results(ctx):
                logger.info("Results detected by rows (no route change yet)", extra={"url": url})
                return Outcome.FOUND_LIST

            # 4) Transient error banner
            if await self._check_error_banner(ctx):
                logger.warning("Error banner detected (transient)")
                return Outcome.ERROR_BANNER

            await asyncio.sleep(0.25)

        # Final pass
        if await self._check_empty_state(ctx):
            return Outcome.FOUND_EMPTY_STATE
        if await self._has_any_results(ctx):
            return Outcome.FOUND_LIST
        if await self._check_error_banner(ctx):
            return Outcome.ERROR_BANNER
        return Outcome.TIMEOUT

    # ------------------ State detectors ------------------

    async def _has_any_results(self, ctx: PageLike) -> bool:
        try:
            if await ctx.locator(self.RESULT_FORM_ANY).count() > 0:
                return True
        except Exception:
            pass
        try:
            if await ctx.locator(self.RESULT_LINK_ANY).count() > 0:
                return True
        except Exception:
            pass
        return False

    async def _is_on_list_route(self, ctx: PageLike) -> bool:
        try:
            page = ctx.page if isinstance(ctx, Frame) else ctx
            return "/lot-renove/liste" in page.url
        except Exception:
            return False

    async def _check_error_banner(self, ctx: PageLike) -> bool:
        """Detect & log the transient error banner with a short text preview for diagnostics."""
        try:
            loc = ctx.locator(self.ERROR_BANNER_SELECTOR).first
            if await loc.is_visible():
                preview = ""
                try:
                    preview = (await loc.inner_text()).strip().replace("\n", " ")
                    if len(preview) > 160:
                        preview = preview[:160] + "…"
                except Exception:
                    preview = ""
                logger.info("Error banner visibility", extra={"visible": True, "text_preview": preview})
                return True
            else:
                logger.info("Error banner visibility", extra={"visible": False})
                return False
        except Exception:
            return False

    async def _check_empty_state(self, ctx: PageLike) -> bool:
        """Detect the definitive 'Aucun résultat…' empty-state block."""
        try:
            root = ctx.locator(self.EMPTY_STATE_WRAPPER).first
            if await root.count() == 0 or not await root.is_visible():
                return False
            desc = root.locator(self.EMPTY_STATE_TEXT_NODE).first
            txt = ""
            if await desc.count() > 0:
                try:
                    txt = (await desc.inner_text()).strip()
                except Exception:
                    txt = ""
            low = txt.lower()
            patterns = [
                r"\baucun\s+r[ée]sultat\s+n'?a\s+été\s+trouv[ée]\b",
                r"\baucun\s+r[ée]sultat\b",
                r"\bno\s+result\b",
                r"\bno\s+results\s+found\b",
            ]
            has_text = any(re.search(p, low) for p in patterns)
            logger.info("Empty-state visibility", extra={"visible": True, "text_detected": has_text, "text_preview": low[:120]})
            return True if has_text or await root.is_visible() else False
        except Exception:
            return False

    async def _recaptcha_present(self, ctx: PageLike) -> bool:
        """Wrapper around :func:`captcha_deviation.recaptcha_present`.

        This method is retained for backward compatibility within the
        web handler.  It delegates to the standalone function in
        ``captcha_deviation`` so that CAPTCHA detection logic lives in
        a single location.  See that module for details.

        Args:
            ctx: A Playwright ``Page`` or ``Frame``.

        Returns:
            ``True`` if a reCAPTCHA is detected, otherwise ``False``.
        """
        return await recaptcha_present(ctx)

    async def _wait_for_recaptcha_token(self, ctx: PageLike, max_wait_s: float = 5.0) -> bool:
        """
        Wrapper around :func:`captcha_deviation.wait_for_recaptcha_token`.
   
        Delegates token waiting to the standalone function, passing
        ``logger.info`` as the logging callback so that debug messages
        integrate with this handler's logging configuration.
        """
        return await wait_for_recaptcha_token(ctx, max_wait_s=max_wait_s, log_func=logger.info)


    # ------------------ Results & detail ------------------

    async def _get_evalunit_ids(self, ctx: PageLike) -> List[str]:
        try:
            ids = await ctx.eval_on_selector_all(self.RESULT_EVALUNIT_INPUT_ANY, "els => els.map(e => e.value)")
            out = [i for i in ids if isinstance(i, str) and i.strip()]
            return out
        except Exception as exc:
            logger.debug("_get_evalunit_ids failed", extra={"error": str(exc)})
            return []

    async def _open_detail_for_eval_id(self, ctx: PageLike, eval_id: str, lot_num: int) -> bool:
        page = ctx.page if isinstance(ctx, Frame) else ctx
        try:
            form_btn = ctx.locator(
                f"form:has(input[name='evalUnitId'][value='{eval_id}']) >> button[type='submit']"
            ).first
            if await form_btn.count() > 0 and await form_btn.is_visible():
                async with page.expect_navigation(wait_until="domcontentloaded", timeout=self.timeout):
                    await form_btn.click()
                await self._wait_spinner_cycle(page)
                # Wait for the detail information to populate.  The evaluation
                # details are loaded asynchronously, so wait for at least one
                # <dt> element to appear.  If it times out, proceed anyway.
                try:
                    await page.wait_for_selector('dt', timeout=10000)
                except Exception:
                    pass
                logger.info("Opened detail via form button", extra={"eval_id": eval_id, "lot": lot_num, "url": page.url})
                return True

            link = ctx.locator(f"a[href*='evalUnitId={eval_id}']").first
            if await link.count() > 0 and await link.is_visible():
                async with page.expect_navigation(wait_until="domcontentloaded", timeout=self.timeout):
                    await link.click()
                await self._wait_spinner_cycle(page)
                try:
                    await page.wait_for_selector('dt', timeout=10000)
                except Exception:
                    pass
                logger.info("Opened detail via link", extra={"eval_id": eval_id, "lot": lot_num, "url": page.url})
                return True

            form = ctx.locator(f"form:has(input[name='evalUnitId'][value='{eval_id}'])").first
            if await form.count() > 0:
                try:
                        async with page.expect_navigation(wait_until="domcontentloaded", timeout=self.timeout):
                            await form.evaluate("(f) => f.submit()")
                        await self._wait_spinner_cycle(page)
                        try:
                            await page.wait_for_selector('dt', timeout=10000)
                        except Exception:
                            pass
                        logger.info("Opened detail via form.submit()", extra={"eval_id": eval_id, "lot": lot_num, "url": page.url})
                        return True
                except Exception:
                    pass

            logger.debug("No clickable detail control found", extra={"eval_id": eval_id})
            return False

        except Exception as exc:
            logger.debug("_open_detail_for_eval_id failed", extra={"error": str(exc)})
            return False

    async def _has_next_page(self, ctx: PageLike) -> bool:
        try:
            loc = ctx.locator(self.NEXT_PAGE_SELECTOR).first
            if await loc.count() == 0:
                return False
            disabled = await loc.get_attribute("aria-disabled")
            if disabled == "true":
                return False
            if (await loc.get_attribute("disabled")) is not None:
                return False
            return await loc.is_visible()
        except Exception:
            return False

    # ------------------ Modularized outcome handlers ------------------

    async def _process_lot(self, page: Page, lot_num: int, run_stats: RunStats) -> Tuple[List[str], Page]:
        """Run attempts for a single lot number until we either finish or skip it.
        Returns (html_snippets, possibly_updated_page). Behavior is identical to the inlined version.
        """
        collected_html: List[str] = []
        attempt = 0
        banners_this_lot = 0

        while True:
            attempt += 1
            logger.info(
                "Searching lot...",
                extra={"lot": lot_num, "attempt": attempt, "ctx_url": self._ctx_url(self.search_ctx)},
            )
            outcome = await self._submit_lot_search(self.search_ctx, lot_num)
            logger.debug("Search outcome", extra={"lot": lot_num, "attempt": attempt, "outcome": outcome.value})

            # ---- Stats + streak bookkeeping (unchanged behavior) ----
            if outcome == Outcome.ERROR_BANNER:
                banners_this_lot += 1
                self.consecutive_banners += 1
                self.stats["banners"] += 1
                run_stats.banners_seen += 1
                await self._dump_debug(page, f"banner_lot_{lot_num}_attempt_{attempt}", extra={"url": page.url})
            else:
                self.consecutive_banners = 0

            if outcome == Outcome.SOFT_EMPTY_LIST:
                self.consecutive_soft_empty += 1
                self.stats["soft_empty"] += 1
                run_stats.soft_empty_hits += 1
                await self._dump_debug(page, f"soft_empty_lot_{lot_num}_attempt_{attempt}", extra={"url": page.url})
            else:
                self.consecutive_soft_empty = 0

            if outcome == Outcome.TIMEOUT:
                self.stats["timeouts"] += 1
                await self._dump_debug(page, f"timeout_lot_{lot_num}_attempt_{attempt}", extra={"url": page.url})

            if outcome == Outcome.FAILED_CONTEXT:
                self.stats["failed_context"] += 1
                await self._dump_debug(page, f"failed_ctx_lot_{lot_num}_attempt_{attempt}", extra={"url": page.url})

            if outcome == Outcome.FOUND_EMPTY_STATE:
                self.stats["empty_state"] += 1
                run_stats.empty_state_hits += 1

            if outcome == Outcome.FOUND_LIST:
                self.stats["found_list"] += 1
                run_stats.lots_with_results += 1

            # Streak-based global cooldown (unchanged)
            if self.consecutive_banners >= self.banner_streak_threshold:
                await self._adaptive_cooldown(page, reason="banner_streak")
            elif self.consecutive_soft_empty >= self.soft_empty_streak_threshold:
                await self._adaptive_cooldown(page, reason="soft_empty_streak")

            # ---- Deterministic post-outcome handling (refactored) ----
            if outcome == Outcome.FOUND_LIST:
                list_htmls = await self._walk_results_pages(page, lot_num, run_stats)
                collected_html.extend(list_htmls)
                await self._return_to_search(page)
                break  # next lot

            elif outcome == Outcome.FOUND_EMPTY_STATE:
                logger.info("Definitive no match (empty-state). Moving on.", extra={"lot": lot_num})
                await self._return_to_search(page)
                break  # next lot

            elif outcome == Outcome.ERROR_BANNER:
                should_continue, page = await self._handle_banner_outcome(page, lot_num, attempt, banners_this_lot)
                if should_continue:
                    continue
                else:
                    break

            elif outcome in (Outcome.SOFT_EMPTY_LIST, Outcome.TIMEOUT, Outcome.FAILED_CONTEXT):
                should_continue, page = await self._handle_transient_retry(page, lot_num, attempt)
                if should_continue:
                    continue
                else:
                    break

        return collected_html, page

    async def _walk_results_pages(self, list_page: Page, lot_num: int, run_stats: RunStats) -> List[str]:
        """Iterate results list, open each detail, collect HTML with metadata, paginate if needed."""
        page = list_page  # alias
        collected_html: List[str] = []
        list_ctx: PageLike = page
        logger.info("On results list", extra={"list_url": self._ctx_url(list_ctx)})

        while True:
            eval_ids = await self._get_evalunit_ids(list_ctx)
            logger.info("Collected evalUnitIds", extra={"count": len(eval_ids), "eval_ids": eval_ids})

            if not eval_ids:
                es = await self._check_empty_state(list_ctx)
                if es:
                    logger.info("Empty-state detected on list (definitive NO MATCH)")
                    break
                if await self._is_on_list_route(list_ctx):
                    logger.warning("Soft empty list detected (0 ids, no empty-state)")
                    break

            for eval_id in eval_ids:
                # Preserve duplicate handling and counters exactly
                if eval_id in self.visited_eval_ids:
                    logger.info("Duplicate evalUnitId encountered", extra={"eval_id": eval_id})
                self.visited_eval_ids.add(eval_id)
                dup_index = self.eval_id_counter.get(eval_id, 0) + 1
                self.eval_id_counter[eval_id] = dup_index

                opened = await self._open_detail_for_eval_id(list_ctx, eval_id, lot_num)
                if opened:
                    run_stats.details_opened += 1
                    html_content = await page.content()
                    meta_prefix = (
                        f"<!--SOURCE_URL:{page.url}--><!--SEARCH_LOT:{lot_num}-->"
                        f"<!--EVAL_ID:{eval_id}--><!--DUP_INDEX:{dup_index}-->"
                    )
                    html_with_meta = meta_prefix + html_content
                    if self._html_has_exact_lot(html_content, str(lot_num)):
                        logger.info("Detail captured (lot match)", extra={"lot": lot_num, "eval_id": eval_id, "url": page.url})
                    else:
                        logger.warning("Detail captured (lot not found in HTML)", extra={"lot": lot_num, "eval_id": eval_id, "url": page.url})
                    collected_html.append(html_with_meta)
                    # Go back to list and wait for spinner
                    try:
                        await page.go_back(timeout=4000)
                    except Exception:
                        pass
                    await self._wait_spinner_cycle(page)
                    list_ctx = page  # still on /liste

            # Pagination
            if not await self._has_next_page(list_ctx):
                break
            try:
                await list_ctx.click(self.NEXT_PAGE_SELECTOR, timeout=5000)
                await self._wait_spinner_cycle(list_ctx)
                logger.info("Paginated to next page", extra={"ctx_url": self._ctx_url(list_ctx)})
            except Exception as exc:
                logger.debug("Pagination failed", extra={"error": str(exc)})
                break

        return collected_html

    async def _handle_banner_outcome(
        self, page: Page, lot_num: int, attempt: int, banners_this_lot: int
    ) -> Tuple[bool, Page]:
        """Returns (should_continue, possibly_updated_page). Mirrors original banner branch."""
        # Enforced wait after ANY banner: configurable (default ≥15s)
        wait_s = round(random.uniform(*self.banner_wait_range), 2)
        logger.info(
            "Banner hit; enforcing per-lot wait before retry",
            extra={"wait_seconds": wait_s, "lot": lot_num, "attempt": attempt, "banners_this_lot": banners_this_lot},
        )
        await asyncio.sleep(wait_s)

        # After 2 banners for this lot: recreate browser context + configurable wait
        if banners_this_lot >= 2:
            logger.info("2+ banners for lot; recreating browser context", extra={"lot": lot_num, "attempt": attempt})
            page = await self._recreate_browser_context(page)
            extra_wait = round(random.uniform(*self.post_recreate_wait_range), 2)
            logger.info("Post-context-recreate wait", extra={"seconds": extra_wait, "lot": lot_num})
            await asyncio.sleep(extra_wait)


        if attempt < self.max_lot_attempts:
            logger.info("Retrying this lot after banner", extra={"lot": lot_num, "next_attempt": attempt + 1})
            await self._workaround_recover_to_search(page)
            await self._rebind_search_ctx(page)
            return True, page

        logger.warning("Capping attempts for this lot after banners; skipping", extra={"lot": lot_num, "attempts": attempt})
        self.skipped_lots.append(lot_num)
        self.stats["lots_skipped"] += 1
        await self._reset_to_search(page)
        await self._rebind_search_ctx(page)
        return False, page

    async def _handle_transient_retry(self, page: Page, lot_num: int, attempt: int) -> Tuple[bool, Page]:
        """Handles SOFT_EMPTY_LIST, TIMEOUT, FAILED_CONTEXT. Returns (should_continue, page)."""
        if attempt < self.max_lot_attempts:
            logger.info("Retrying with workaround after transient issue", extra={"lot": lot_num, "attempt": attempt})
            await self._workaround_recover_to_search(page)
            await self._rebind_search_ctx(page)
            await asyncio.sleep(random.uniform(1.2, 2.4))  # small jitter (not a banner)
            return True, page

        logger.warning("Exhausted attempts for this lot; moving on", extra={"lot": lot_num, "attempts": attempt})
        self.skipped_lots.append(lot_num)
        self.stats["lots_skipped"] += 1
        await self._reset_to_search(page)
        await self._rebind_search_ctx(page)
        return False, page

    async def _return_to_search(self, page: Page) -> None:
        """Thin wrapper to go back to the lot search and rebind the input context."""
        await self._reset_to_search(page)
        await self._rebind_search_ctx(page)

    # ------------------ Recovery, cooldown & navigation helpers ------------------

    async def _adaptive_cooldown(self, page: Page, reason: str) -> None:
        """Apply a human-ish cooldown and optionally refresh UI to clear throttling."""
        if reason == "banner_streak":
            lo, hi = self.banner_cooldown_range
            sleep_s = random.uniform(lo, hi)
            logger.info("Banner streak detected; entering adaptive cooldown", extra={"seconds": round(sleep_s, 2)})
        elif reason == "soft_empty_streak":
            lo, hi = self.soft_empty_cooldown_range
            sleep_s = random.uniform(lo, hi)
            logger.info("Soft-empty streak detected; entering adaptive cooldown", extra={"seconds": round(sleep_s, 2)})
        else:
            sleep_s = random.uniform(4.0, 7.0)
            logger.info("Generic cooldown", extra={"seconds": round(sleep_s, 2)})

        try:
            await page.mouse.move(random.uniform(100, 800), random.uniform(100, 600))
        except Exception:
            pass

        await asyncio.sleep(sleep_s)

        if self.reload_on_cooldown:
            try:
                await page.reload(wait_until="domcontentloaded", timeout=self.timeout)
                await asyncio.sleep(0.3)
                await self._rebind_search_ctx(page)
            except Exception:
                pass

        self.consecutive_banners = 0
        self.consecutive_soft_empty = 0

    async def _workaround_recover_to_search(self, page: Page) -> None:
        """Robustly return to the search form using in-UI back controls if present."""
        logger.info("Workaround: recover to search (try 'Nouvelle recherche' then direct goto)")
        try:
            main_ctx: PageLike = page
            back_link = main_ctx.locator(self.EMPTY_STATE_BACK_LINK).first
            if await back_link.count() > 0 and await back_link.is_visible():
                await back_link.click()
                await self._wait_spinner_cycle(main_ctx)
                await asyncio.sleep(0.2)
        except Exception as exc:
            logger.debug("Back link click failed or not present", extra={"error": str(exc)})
        await self._reset_to_search(page)

    async def _recover_with_new_tab(self, page: Page) -> Page:
        """Open a fresh tab in the same BrowserContext and go straight to /lot-renove."""
        logger.info("New-tab recovery: opening fresh tab")
        try:
            ctx = page.context
            new_page = await ctx.new_page()
            await new_page.goto(f"{self.base_url}/role-evaluation-fonciere/lot-renove",
                                wait_until="domcontentloaded", timeout=self.timeout)
            await self._wait_spinner_gone(new_page)
            await self._rebind_search_ctx(new_page)
            await self._dump_debug(new_page, "recovered_new_tab_ready", extra={"from_url": page.url})
            try:
                await page.close()
            except Exception:
                pass
            return new_page
        except Exception as exc:
            logger.warning("New-tab recovery failed; falling back to reset", extra={"error": str(exc)})
            await self._reset_to_search(page)
            await self._rebind_search_ctx(page)
            return page

    async def _recreate_browser_context(self, page: Page) -> Page:
        """Close current context and open a fresh one (resets cookies/storage for reCAPTCHA)."""
        logger.info("Recreating browser context")
        try:
            old_ctx = page.context
            try:
                await old_ctx.close()
            except Exception:
                pass
            if not self._browser:
                raise RuntimeError("Browser handle not available for context recreation")
            new_ctx = await self._browser.new_context()
            new_page = await new_ctx.new_page()
            await new_page.goto(f"{self.base_url}/role-evaluation-fonciere/lot-renove",
                                wait_until="domcontentloaded", timeout=self.timeout)
            await self._wait_spinner_gone(new_page)
            await self._rebind_search_ctx(new_page)
            await self._dump_debug(new_page, "recreated_context_ready", extra={"from_url": page.url})
            return new_page
        except Exception as exc:
            logger.warning("Context recreation failed; falling back to reset", extra={"error": str(exc)})
            await self._reset_to_search(page)
            await self._rebind_search_ctx(page)
            return page

    async def _reset_to_search(self, page: Page) -> None:
        logger.info("Resetting to search step (go_back -> reload fallback)")
        try:
            await page.go_back(timeout=2500)
        except Exception:
            pass
        try:
            await page.wait_for_load_state("domcontentloaded")
        except Exception:
            pass
        url = page.url
        if "/lot-renove/liste" in url or "/role-evaluation-fonciere/lot-renove" not in url:
            try:
                await page.goto(f"{self.base_url}/role-evaluation-fonciere/lot-renove", wait_until="domcontentloaded", timeout=self.timeout)
            except Exception:
                try:
                    await page.reload(wait_until="domcontentloaded", timeout=self.timeout)
                except Exception:
                    pass
        await asyncio.sleep(0.2)

    # ------------------ Waiting helpers ------------------

    async def _wait_spinner_gone(self, ctx: PageLike) -> None:
        try:
            if await ctx.locator(self.SPINNER_SELECTOR).is_visible():
                logger.info("Spinner visible; waiting to disappear")
                await ctx.locator(self.SPINNER_SELECTOR).first.wait_for(state="detached", timeout=self.wait_table_ms)
        except Exception:
            pass

    async def _wait_spinner_cycle(self, ctx: PageLike) -> None:
        """Wait for spinner to appear (if it will) and then disappear."""
        try:
            appeared = False
            try:
                await ctx.locator(self.SPINNER_SELECTOR).first.wait_for(state="visible", timeout=2000)
                appeared = True
                logger.info("Spinner appeared; waiting to disappear")
            except Exception:
                pass
            if appeared:
                try:
                    await ctx.locator(self.SPINNER_SELECTOR).first.wait_for(state="detached", timeout=self.wait_table_ms)
                except Exception:
                    await ctx.locator(self.SPINNER_SELECTOR).first.wait_for(state="hidden", timeout=self.wait_table_ms)
        except Exception:
            pass

    # ------------------ Debug artifacts & run summary ------------------

    def _safe_label(self, label: str) -> str:
        return re.sub(r"[^a-zA-Z0-9._-]+", "_", label)[:80]

    async def _dump_debug(self, page: Page, label: str, extra: Optional[Dict[str, Any]] = None) -> None:
        """Capture HTML/screenshot/metadata for offline analysis (best-effort)."""
        if not self.debug_artifacts_dir:
            return
        if self._artifact_count >= self.debug_max_artifacts:
            return
        self._artifact_count += 1

        try:
            self.debug_artifacts_dir.mkdir(parents=True, exist_ok=True)
        except Exception:
            return

        ts = int(time.time() * 1000)
        safe = self._safe_label(label)
        base = self.debug_artifacts_dir / f"{ts}_{safe}"
        meta: Dict[str, Any] = {
            "label": label,
            "ts": ts,
            "iso": datetime.utcnow().isoformat() + "Z",
            "url": None,
            "stats": self.stats.copy(),
            "streaks": {
                "consecutive_banners": self.consecutive_banners,
                "consecutive_soft_empty": self.consecutive_soft_empty,
            },
            "extra": extra or {},
        }
        try:
            meta["url"] = page.url
        except Exception:
            pass

        if self.debug_capture_html:
            try:
                html = await page.content()
                base.with_suffix(".html").write_text(html, encoding="utf-8")
            except Exception:
                pass
        if self.debug_capture_screens:
            try:
                await page.screenshot(path=str(base.with_suffix(".png")), full_page=True)
            except Exception:
                pass
        try:
            base.with_suffix(".json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass

    async def _dump_summary(self) -> None:
        if not self.debug_artifacts_dir:
            return
        try:
            self.debug_artifacts_dir.mkdir(parents=True, exist_ok=True)
            path = self.debug_artifacts_dir / f"run_summary_{int(time.time()*1000)}.json"
            summary = {
                "stats": self.stats,               # existing counters
                "skipped_lots": self.skipped_lots, # NEW: list of lots skipped after max attempts
            }
            path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
        except Exception:
            pass


    # ------------------ Small utils ------------------

    async def _count(self, ctx: PageLike, selector: str) -> int:
        try:
            return await ctx.locator(selector).count()
        except Exception:
            return 0

    def get_skipped_lots(self) -> List[int]:
        """Return the list of lots that were skipped after max attempts."""
        return list(self.skipped_lots)

    def _ctx_url(self, ctx: PageLike) -> str:
        try:
            return (ctx.page.url if isinstance(ctx, Frame) else ctx.url) or ""
        except Exception:
            return ""

    def _frame_info(self, f: Frame) -> Dict[str, Any]:
        try:
            return {"name": f.name, "url": f.url}
        except Exception:
            return {"name": None, "url": None}




    @staticmethod
    def _html_has_exact_lot(html: str, lot_str: str) -> bool:
        try:
            if not lot_str:
                return False
            pattern = rf"(?<!\d){re.escape(lot_str)}(?!\d)"
            return re.search(pattern, html or "") is not None
        except Exception as exc:
            logger.debug(
                "Exact-lot regex check failed; treating as no-match",
                extra={"lot_str": lot_str, "error": str(exc)},
            )
            return False

    async def _eval_row_matches_lot(self, ctx: PageLike, eval_id: str, lot_num: int) -> bool:
        """
        Check whether a result row corresponding to ``eval_id`` contains the
        searched lot number.  This prevents navigating into detail pages for
        unrelated lots that may appear in the results list.

        The check is heuristic: it looks at the visible text of the row (form
        or link) and ensures the lot number appears as a standalone number.
        If the row cannot be found or inspected, ``True`` is returned to
        avoid false negatives.

        Args:
            ctx: The current list page context (Page or Frame).
            eval_id: Evaluation unit identifier extracted from the row.
            lot_num: The integer lot number being searched.

        Returns:
            ``True`` if the lot number appears in the row text, otherwise ``False``.
        """
        # Build a regex pattern that matches the exact lot number as a standalone token
        lot_str = str(lot_num)
        pattern = rf"(?<!\d){re.escape(lot_str)}(?!\d)"

        try:
            # Try to locate a form row first
            form_row = ctx.locator(
                f"form:has(input[name='evalUnitId'][value='{eval_id}'])"
            ).first
            if await form_row.count() > 0:
                text = (await form_row.inner_text()).strip()
                if re.search(pattern, text):
                    return True
                else:
                    return False
            # Fallback: try to locate an anchor link row
            link_row = ctx.locator(f"a[href*='evalUnitId={eval_id}']").first
            if await link_row.count() > 0:
                text = (await link_row.inner_text()).strip()
                if re.search(pattern, text):
                    return True
                else:
                    return False
        except Exception as exc:
            # Intentional: best-effort check can be indeterminate; keep pipeline permissive.
            logger.debug(
                "Row text check indeterminate; permissive fallback=True",
                extra={"eval_id": eval_id, "lot": lot_num, "error": str(exc)},
            )
            return True
   
        # Intentional: no row located (DOM in flux / pagination). Avoid false negatives.
        logger.debug(
            "No row located for eval_id; permissive fallback=True",
            extra={"eval_id": eval_id, "lot": lot_num},
        )
        return True
