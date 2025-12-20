import asyncio
import logging
from typing import Any, Dict, List, Optional
from playwright.async_api import async_playwright, Page, Browser # type: ignore
from lib.abstract_scraper import AbstractWebHandler


class LavalCouncilWebHandler(AbstractWebHandler):
    """
    Specific implementation for fetching data from the Laval Council page.
    Returns raw HTML strings instead of ElementHandles to avoid browser closure issues.
    """
    TABLE_ROW_SELECTOR = "table tbody tr"
    NEXT_BUTTON_SELECTOR = "li.next a, a.paginate_button.next, a[aria-label='Next']"

    def __init__(self, settings: Dict[str, Any]):
        self.base_url = settings.get('base_url', 'https://www.laval.ca')
        self.start_url_path = settings.get('start_url_path', '')
        self.full_url = self.base_url + self.start_url_path
        self.headless = settings.get('headless', True)
        self.timeout = settings.get('timeout_ms', 60000)
        self._browser: Optional[Browser] = None

    async def _handle_pagination(self, page: Page) -> bool:
        """Tries to click the 'Next' button."""
        next_button = page.locator(self.NEXT_BUTTON_SELECTOR).first
        
        if not await next_button.count():
            logging.info("Next button not found. Assuming end of pagination.")
            return False
        # Check if the button is disabled
        is_disabled = await next_button.get_attribute("class") or ""
        if is_disabled and "disabled" in is_disabled:
            logging.info("Next button is disabled. Reached end of pagination.")
            return False
        
        try:
            # Get first row's HTML before clicking (to detect change)
            first_row_before = await page.locator(self.TABLE_ROW_SELECTOR).first.inner_html()
            
            # Click next button
            await next_button.click(timeout=5000)
            
            max_attempts = 20  # 10 seconds total
            for attempt in range(max_attempts):
                await asyncio.sleep(0.5)
                try:
                    first_row_after = await page.locator(self.TABLE_ROW_SELECTOR).first.inner_html()
                    if first_row_after != first_row_before:
                        # Table changed! Wait a bit more for full render
                        await asyncio.sleep(1)
                        return True
                except:
                    pass  # Table might be temporarily empty during load
            
            logging.warning("Table didn't change after pagination click")
            return False
            
        except Exception as e:
            logging.warning(f"Failed to click next or wait for new page: {e}")
            return False
            
    async def _extract_row_html(self, page: Page) -> List[str]:
        """
        Extract HTML content of all rows on current page.
        Returns list of HTML strings.
        """
        await asyncio.sleep(0.5)
        rows = await page.query_selector_all(self.TABLE_ROW_SELECTOR)
        row_htmls = []
        
        for row in rows:
            html = await row.inner_html()
            row_htmls.append(html)
        
        return row_htmls

    async def _print_page_preview(self, page: Page, page_num: int, row_count: int) -> None:
        """
        Print preview of what was found on this page.
        """
        logging.info(f"Page {page_num}: Found {row_count} rows")
        
        # Print all rows
        rows = await page.query_selector_all(self.TABLE_ROW_SELECTOR)
        for i, row in enumerate(rows): 
            try:
                cells = await row.query_selector_all("td")
                if len(cells) >= 6:
                    meeting_date = await cells[3].inner_text()
                    doc_title = await cells[5].inner_text()
                    logging.info(f"  └─ Row {i+1}: {meeting_date.strip()} - {doc_title.strip()[:60]}...")
            except Exception as e:
                logging.debug(f"  └─ Row {i+1}: Could not extract preview - {e}")

    async def fetch_rows(self) -> List[str]:
        """
        Implements AbstractWebHandler.fetch_rows.
        Returns list of HTML strings instead of ElementHandles.
        """
        all_row_htmls: List[str] = []
        
        async with async_playwright() as pw:
            self._browser = await pw.chromium.launch(headless=self.headless)
            page = await self._browser.new_page()
            
            try:
                logging.info(f"Navigating to: {self.full_url}")
                await page.goto(self.full_url, wait_until="networkidle", timeout=self.timeout)
                
                await page.wait_for_selector(self.TABLE_ROW_SELECTOR, timeout=30000)
                
                await asyncio.sleep(1)
            except Exception as e:
                logging.error(f"Failed to load or stabilize page: {e}")
                await self._browser.close()
                return all_row_htmls
            
            page_index = 1
            while True:
                # Extract HTML from current page
                current_rows = await self._extract_row_html(page)
                all_row_htmls.extend(current_rows)
                
                # Print preview
                await self._print_page_preview(page, page_index, len(current_rows))
                
                # Try to go to next page
                if not await self._handle_pagination(page):
                    break
                
                page_index += 1
            
            await self._browser.close()
        
        return all_row_htmls