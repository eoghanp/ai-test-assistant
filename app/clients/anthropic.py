from typing import Optional
from .base import AIClient, AIClientError

import anthropic


class AnthropicAIClient(AIClient):

    def __init__(self, api_key: Optional[str], model_name: Optional[str] = None, max_tokens: int = 4000):
        if not api_key:
            raise AIClientError("Anthropic API key is not configured", code=None, transient=False)
        if anthropic is None:
            raise AIClientError("anthropic package is not installed", code=None, transient=False)
        self.client = anthropic.Anthropic(api_key=api_key)
        self.model = model_name or "claude-opus-4-6"
        self.max_tokens = max_tokens

    def _call_llm(self, prompt: str) -> str:
        try:
            resp = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                messages=[{"role": "user", "content": prompt}]
            )
            return resp.content[0].text
        except Exception as exc:
            raise AIClientError(exc, code=None, transient=True, details=str(exc))

