from time import sleep
from typing import Any

from app.clients import get_client
from app.config import get_ai_config
from app.clients.base import AIClientError


# Cache for clients
_clients = {}

def _get_client(provider: str = None):
    config = get_ai_config()
    provider_to_use = provider or config.get("AI_PROVIDER")
    if provider_to_use not in _clients:
        _clients[provider_to_use] = get_client(provider_to_use, config)
    return _clients[provider_to_use]


def _with_retries(func, *args, **kwargs):
    config = get_ai_config()
    policy = config.get("RETRY_POLICY", {"max_retries": 3, "backoff_factor": 0.5})
    max_retries = policy.get("max_retries", 3)
    backoff = policy.get("backoff_factor", 0.5)

    attempt = 0
    while True:
        try:
            return func(*args, **kwargs)
        except AIClientError as e:
            attempt += 1
            if not e.transient or attempt > max_retries:
                raise
            sleep(backoff * (2 ** (attempt - 1)))
        except Exception:
            raise


def generate_test_plan(
    start_date: str,
    end_date: str,
    feature_summary: str,
    requirements: str,
    provider: str = None,
) -> str:
    """
    Generate a comprehensive test plan using the AI model.
    """
    client = _get_client(provider)
    return _with_retries(client.generate_test_plan, start_date, end_date, feature_summary, requirements)


def generate_test_cases(
    feature_summary: str,
    requirements: str,
    format_type: str,
    json_schema: str | None = None,
    provider: str = None,
) -> str:
    """
    Generate test cases in the specified format using the AI model.
    """
    client = _get_client(provider)
    return _with_retries(client.generate_test_cases, feature_summary, requirements, format_type, json_schema)
