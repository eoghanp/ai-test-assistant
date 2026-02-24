from behave import given, when, then
from playwright_tests.support.browser_factory import BrowserFactory
from playwright_tests.pages.generator_page import GeneratorPage
from datetime import datetime, timedelta
from playwright_tests.utils.excel_reader import get_feature_data
import os

@given("I open the test assistant page")
def step_open_generator_page(context):
    context.browser_factory = BrowserFactory(headless=False)
    context.page = context.browser_factory.start()
    context.generator_page = GeneratorPage(context.page)
    context.generator_page.navigate(os.getenv("APP_URL"))

@when("I fill out the generator form")
def step_enter_feature_summary(context):
    generator_page = context.generator_page
    summary, requirements = get_feature_data()
    context.feature_summary = summary
    context.feature_requirements = requirements

    today = datetime.today()
    today_str = today.strftime("%Y-%m-%d")
    five_days_later = today + timedelta(days=5)
    five_days_later_str = five_days_later.strftime("%Y-%m-%d")

    generator_page.enter_start_date(today_str)
    generator_page.enter_end_date(five_days_later_str)
    generator_page.enter_feature_summary(summary)
    generator_page.enter_feature_requirements(requirements)
    breakpoint()


@when("I generate a test plan")
def generate_test_plan(context):
    generator_page = context.generator_page
    generator_page.generate_test_plan()
    generator_page.get_generator_message()


@then("I should see the generated test plan")
def should_see_plan(context):
    generator_page = context.generator_page

    with context.page.expect_response(
            lambda response:
            response.url.endswith("/generate-plan")
            and response.status == 200,
            timeout=180000
    ):
        generator_page.view_ai_output()
