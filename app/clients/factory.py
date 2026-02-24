from typing import Any, Dict
from .base import AIClientError
from .google import GoogleAIClient
from .openai import OpenAIAIClient
from .anthropic import AnthropicAIClient
from .deepseek import DeepSeekAIClient


def get_client(provider_name: str, config: Dict[str, Any]):

    provider = (provider_name or "").strip().lower()

    if provider == "google":
        return GoogleAIClient(
            api_key=config.get("GOOGLE_API_KEY"),
            model_name=config.get("MODEL_NAME"),
            max_tokens=config.get("MAX_TOKENS")
        )

    if provider == "openai":
        return OpenAIAIClient(
            api_key=config.get("OPENAI_API_KEY"),
            model_name=config.get("OPENAI_MODEL_NAME"),
            max_tokens=config.get("MAX_TOKENS")
        )

    if provider == "anthropic":
        return AnthropicAIClient(
            api_key=config.get("ANTHROPIC_API_KEY"),
            model_name=config.get("ANTHROPIC_MODEL_NAME"),
            max_tokens=config.get("MAX_TOKENS")
        )

    if provider == "deepseek":
        return DeepSeekAIClient(
            api_key=config.get("DEEPSEEK_API_KEY"),
            model_name=config.get("DEEPSEEK_MODEL_NAME"),
            max_tokens=config.get("MAX_TOKENS")
        )

    raise AIClientError(f"Unknown AI provider: {provider}")
