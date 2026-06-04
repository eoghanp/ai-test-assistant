from typing import Optional
from .base import AIClient, AIClientError

try:
    import openai
except Exception:
    openai = None


class OpenAIAIClient(AIClient):

    def __init__(self, api_key: Optional[str], model_name: Optional[str] = None, max_tokens: int = 4000):
        if not api_key:
            raise AIClientError("OpenAI API key is not configured", code=None, transient=False)
        if openai is None:
            raise AIClientError("openai package is not installed", code=None, transient=False)
        self.client = openai.OpenAI(api_key=api_key)
        self.model = model_name or "gpt-4o"
        self.max_tokens = max_tokens

    def _call_llm(self, prompt: str) -> str:
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=self.max_tokens,
            )
            return resp.choices[0].message.content
        except openai.APIError as exc:
            raise AIClientError(
                message=exc.message or str(exc),
                code=exc.status_code,
                transient=(exc.status_code is not None and (exc.status_code >= 500 or exc.status_code == 429)),
                details=exc.body
            )
        except Exception as exc:
            raise AIClientError(str(exc), code=None, transient=True, details=str(exc))


