
class Helper:
    def __init__(self, context):
        self.context = context

    def wait_for_api_response(self, context, endpoint):
        with context.page.expect_response(
                lambda response:
                response.url.endswith(endpoint)
                and response.status == 200,
                timeout=180000
        ):
            context.view_ai_output()