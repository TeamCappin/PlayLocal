import logging
# from playwright.sync_api import sync_playwright, Browser, Page
from playwright.async_api import async_playwright, Browser, Page

logger = logging.getLogger(__name__)

DEFAULT_USER_AGENT = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36"
)

class BrowserAgent:
    """
    A modular browser agent for scraping, using Playwright.
    Supports headless mode, automatic logging, and context manager usage.
    """

    def __init__(self, headless: bool = True, user_agent: str | None = None):
        self.headless = headless
        self.user_agent = user_agent or DEFAULT_USER_AGENT
        self.playwright = None
        self.browser: Browser | None = None
        self.context = None
        self.page: Page | None = None

    async def __aenter__(self):
        # self.playwright = sync_playwright().start()
        self.playwright = await async_playwright().start()
        self.browser = await self.playwright.chromium.launch(headless=self.headless)
        self.context = await self.browser.new_context(user_agent=self.user_agent)
        self.page = await self.context.new_page()

        logger.info("BrowserAgent initialized")
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.page:
            await self.page.close()
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()
        if self.playwright:
            await self.playwright.stop()
        logger.info("BrowserAgent closed")

    async def navigate(self, url: str, wait_until: str = None, timeout: int = None, retries: int = 3):
        wait_until = wait_until or "networkidle"
        timeout = timeout or 60000
        for attempt in range(1, retries + 1):
            try:
                logger.info(f"Navigating to {url} (attempt {attempt})")
                await self.page.goto(url, wait_until=wait_until, timeout=timeout)
                return
            except Exception as exc:
                logger.warning(f"Failed to navigate to {url} on attempt {attempt}: {exc}")
                if attempt == retries:
                    raise

    async def get_content(self) -> str:
        if not self.page:
            raise RuntimeError("BrowserAgent not initialized. Use 'async with' or call aenter() first.")
        return await self.page.content()
