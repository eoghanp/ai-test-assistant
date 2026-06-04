def after_scenario(context, scenario):
    if hasattr(context, "browser_factory") and context.browser_factory:
        context.browser_factory.stop()
        context.browser_factory = None
