from playwright.sync_api import Page

from playwright_tests.pages.base_page import BasePage


class GeneratorPage(BasePage):
    def __init__(self, page: Page):
        super().__init__(page)

    def enter_feature_summary(self, text: str):
        self.page.fill("#feature_summary", text)

    def enter_start_date(self, date):
        self.page.fill("#start_date", date)

    def enter_end_date(self, date):
        self.page.fill("#end_date", date)

    def enter_feature_requirements(self, text: str):
        self.page.fill("#requirements", text)

    def generate_test_plan(self):
        self.page.click("#generatePlanBtn")

    def get_generator_message(self):
        self.page.wait_for_selector("#spinnerMessage", state="visible")

    def view_ai_output(self):
        self.page.wait_for_selector("#outputContainer", state="visible")
