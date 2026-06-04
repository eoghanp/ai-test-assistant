from google import genai
from google.genai.errors import APIError
from typing import Optional
from .base import AIClient, AIClientError


class GoogleAIClient(AIClient):

    def __init__(self, api_key: str, model_name: str = "gemini-2.5-flash", max_tokens: int = 4000):
        if not api_key:
            raise AIClientError("Google API key is not configured", code=None, transient=False)
        self.client = genai.Client(api_key=api_key)
        self.model = model_name
        self.max_tokens = max_tokens

    def _call_llm(self, prompt: str) -> str:
        try:
            response = self.client.models.generate_content(model=self.model, contents=prompt)
            content = response.text
            if getattr(response, "candidates", None) and getattr(response.candidates[0], "finish_reason", None):
                if "MAX_TOKENS" in str(response.candidates[0].finish_reason):
                    content += "\n\nToken limit reached for output"
            return content
        except APIError as exc:
            raise AIClientError(
                message=exc.message or str(exc),
                code=exc.code,
                transient=(exc.code is not None and (exc.code >= 500 or exc.code == 429)),
                details=exc.details
            )
        except Exception as exc:
            raise AIClientError(str(exc), code=None, transient=True, details=str(exc))


