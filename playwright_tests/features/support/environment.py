from playwright_tests.support.browser_factory import BrowserFactory

def before_scenario(context, scenario):
    context.browser_factory = BrowserFactory(headless=False)
    context.page = context.browser_factory.start()

def after_scenario(context, scenario):
    if hasattr(context, "browser_factory"):
        context.browser_factory.stop_browser()
