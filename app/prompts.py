
def get_test_plan_prompt(start_date: str, end_date: str, feature_summary: str, requirements: str) -> str:
    """Generate a prompt for creating a comprehensive test plan."""
    return f"""
You are a Senior Quality Assurence Test Engineer.

Create a comprehensive test plan.

Testing Window:
Start Date: {start_date}
End Date: {end_date}

Feature Summary:
{feature_summary}

Requirements:
{requirements}

Include:
- Scope
- Out of Scope
- Risks
- Functional Strategy
- Automation Strategy
- Security Testing
- Performance Testing
- Timeline
- Exit Criteria

Be structured and professional.
"""


def get_test_cases_prompt(feature_summary: str, requirements: str, format_instruction: str) -> str:
    """Generate a prompt for creating test cases."""
    return f"""
You are a Senior QA Engineer.

Feature Summary:
{feature_summary}

Requirements:
{requirements}

Create comprehensive:
- Positive tests
- Negative tests
- Edge cases
- Boundary tests
- Error handling tests
- Security tests

{format_instruction}
"""


def get_gherkin_format_instruction() -> str:
    return """
Generate test cases in BDD Gherkin format:

Feature:
Scenario:
Given
When
Then
And

These steps are going to be displayed in a markup style. 
So display them in a neat and clean format without any extra commentary or explanation. 
Return only the Gherkin text.
"""


def get_json_format_instruction(json_schema: str | None = None) -> str:
    if json_schema and json_schema.strip():
        return f"""
Generate test cases in valid JSON format.

STRICTLY follow this exact JSON structure example:

{json_schema}

- Keep the same field names.
- Keep the same nesting structure.
- Return ONLY valid JSON.
- Do not include commentary.
"""
    else:
        return """
Generate test cases in valid JSON format.

Default structure:
[
  {
    "id": "",
    "title": "",
    "preconditions": "",
    "steps": [],
    "expected_result": "",
    "priority": "",
    "type": ""
  }
]

Return ONLY valid JSON.
"""


def get_steps_format_instruction() -> str:
    """Get instructions for Test Steps format."""
    return """
Generate detailed manual test cases in Test Steps format:

Test Case ID:
Title:
Preconditions:
Steps:
Expected Result:
Priority:
Type:
"""

