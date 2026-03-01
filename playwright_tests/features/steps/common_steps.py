from behave import given, when, then
from playwright_tests.support.browser_factory import BrowserFactory
from playwright_tests.pages.generator_page import GeneratorPage
from datetime import datetime, timedelta
from playwright_tests.utils.excel_reader import get_feature_data
from playwright_tests.features.steps.helper import Helper
import os
from dotenv import load_dotenv


@given("I open the test assistant page")
def step_open_generator_page(context):
    load_dotenv()
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


@when("I generate a test plan")
def generate_test_plan(context):
    generator_page = context.generator_page
    generator_page.generate_test_plan()
    generator_page.get_generator_message()


@when("I choose to generate test cases in {format_type} format")
def select_format(context, format_type):
    format_type = format_type.lower()

    if format_type not in ["steps", "json"]:
        raise ValueError(f"Invalid test case format: {format_type}")

    generator_page = context.generator_page
    generator_page.show_test_case_generator()
    generator_page.select_test_case_format(format_type)


@when("I enter valid JSON test format data")
def enter_valid_json(context):
    generator_page = context.generator_page

    json_schema_path = os.path.join("test_data", "test_schema.json")
    with open(json_schema_path, "r") as f:
        json_schema = f.read()

    generator_page.enter_sample_json(json_schema)

@when("I generate test cases")
def generate_test_cases(context):
    generator_page = context.generator_page

    generator_page.select_generate_tests()


@then("I should see the generated test plan")
def should_see_plan(context):
    generator_page = context.generator_page

    helper = Helper(context.page)
    helper.wait_for_api_response(generator_page, "/generate-plan")


@then("I should see the generated test cases")
def should_see_test_cases(context):
    generator_page = context.generator_page

    helper = Helper(context.page)
    helper.wait_for_api_response(generator_page, "/generate-cases")
