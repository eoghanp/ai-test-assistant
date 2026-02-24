import os
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).parent.parent
load_dotenv(BASE_DIR / ".env")

STATIC_DIR = BASE_DIR / "app" / "static"
TEMPLATES_DIR = BASE_DIR / "app" / "templates"

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

MODEL_NAME = os.getenv("MODEL_NAME", "gemini-2.5-flash")
OPENAI_MODEL_NAME = os.getenv("OPENAI_MODEL_NAME", "gpt-4.1")
ANTHROPIC_MODEL_NAME = os.getenv("ANTHROPIC_MODEL_NAME", "claude-opus-4-6")
DEEPSEEK_MODEL_NAME = os.getenv("DEEPSEEK_MODEL_NAME", "DeepSeek-V3")


AI_PROVIDER = os.getenv("AI_PROVIDER", "google").lower()
AI_MAX_TOKENS = int(os.getenv("AI_MAX_TOKENS", "4000"))

DEBUG = os.getenv("DEBUG", "False").lower() == "true"
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

RETRY_POLICY = {
    "max_retries": int(os.getenv("AI_MAX_RETRIES", "3")),
    "backoff_factor": float(os.getenv("AI_BACKOFF_FACTOR", "0.5")),
}


def get_ai_config() -> dict:
    """Return a dictionary of AI-related configuration values for the factory."""
    return {
        "AI_PROVIDER": AI_PROVIDER,
        "GOOGLE_API_KEY": GOOGLE_API_KEY,
        "MODEL_NAME": MODEL_NAME,
        "OPENAI_API_KEY": OPENAI_API_KEY,
        "OPENAI_MODEL_NAME": OPENAI_MODEL_NAME,
        "ANTHROPIC_API_KEY": ANTHROPIC_API_KEY,
        "ANTHROPIC_MODEL_NAME": ANTHROPIC_MODEL_NAME,
        "DEEPSEEK_API_KEY": DEEPSEEK_API_KEY,
        "DEEPSEEK_MODEL_NAME": DEEPSEEK_MODEL_NAME,
        "MAX_TOKENS": AI_MAX_TOKENS,
        "RETRY_POLICY": RETRY_POLICY,
    }
