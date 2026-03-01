from playwright.sync_api import sync_playwright

class BrowserFactory:
    def __init__(self, browser_type="chromium", headless=False, video_dir="test_data/test_recordings"):
        self.browser_type = browser_type
        self.headless = headless
        self.playwright = None
        self.browser = None
        self.context = None
        self.video_dir = video_dir

    def start(self):
        self.playwright = sync_playwright().start()
        if self.browser_type == "chromium":
            self.browser = self.playwright.chromium.launch(headless=self.headless)
        elif self.browser_type == "firefox":
            self.browser = self.playwright.firefox.launch(headless=self.headless)
        elif self.browser_type == "webkit":
            self.browser = self.playwright.webkit.launch(headless=self.headless)
        else:
            raise ValueError(f"Unsupported browser type: {self.browser_type}")

        self.context = self.browser.new_context(record_video_dir=self.video_dir)
        self.context.set_default_timeout(10000)

        return self.context.new_page()

    def stop(self):
        if self.context:
            self.context.close()
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
