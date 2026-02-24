from typing import Optional
from .base import AIClient, AIClientError

try:
    import openai
except Exception:
    openai = None


class DeepSeekAIClient(AIClient):
    """DeepSeek client wrapper using OpenAI-compatible API."""

    def __init__(self, api_key: Optional[str], model_name: Optional[str] = None, max_tokens: int = 4000):
        if not api_key:
            raise AIClientError("DeepSeek API key is not configured", code=None, transient=False)
        if openai is None:
            raise AIClientError("openai package is not installed", code=None, transient=False)
        
        self.client = openai.OpenAI(
            api_key=api_key,
            base_url="https://api.deepseek.com"
        )
        self.model = model_name or "DeepSeek-V3"
        self.max_tokens = max_tokens

    def _call_llm(self, prompt: str) -> str:
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=self.max_tokens,
            )
            return resp.choices[0].message.content
        except Exception as exc:
            raise AIClientError(exc, code=None, transient=True, details=str(exc))
