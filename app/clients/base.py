from abc import ABC, abstractmethod
from typing import Any, Optional


class AIClientError(Exception):

    def __init__(self, message: str, code: Optional[int] = None, transient: bool = False, details: Any = None):
        super().__init__(message)
        self.code = code
        self.message = message
        self.transient = transient
        self.details = details


class AIClient(ABC):

    def generate_test_plan(self, start_date: str, end_date: str, feature_summary: str, requirements: str) -> str:
        from app.prompts import get_test_plan_prompt
        prompt = get_test_plan_prompt(start_date, end_date, feature_summary, requirements)
        return self._call_llm(prompt)

    def generate_test_cases(self, feature_summary: str, requirements: str, format_type: str, json_schema: str | None = None) -> str:
        from app.prompts import get_test_cases_prompt, get_gherkin_format_instruction, get_json_format_instruction, get_steps_format_instruction

        if format_type == "gherkin":
            format_instruction = get_gherkin_format_instruction()
        elif format_type == "json":
            format_instruction = get_json_format_instruction(json_schema)
        else:
            format_instruction = get_steps_format_instruction()

        prompt = get_test_cases_prompt(feature_summary, requirements, format_instruction)
        return self._call_llm(prompt)

    @abstractmethod
    def _call_llm(self, prompt: str) -> str:
        """Execute the actual API call to the LLM."""
        raise NotImplementedError

