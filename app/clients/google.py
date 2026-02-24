from google import genai
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
            return response.text
        except Exception as exc:
            raise AIClientError(exc, code=None, transient=True, details=str(exc))

