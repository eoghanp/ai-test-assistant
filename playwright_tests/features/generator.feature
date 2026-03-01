Feature: Generator Agent

  Scenario: Generate a test plan
    Given I open the test assistant page
    When I fill out the generator form
    And I generate a test plan
    Then I should see the generated test plan

@invalid_credentials
  Scenario: Generate test cases
    Given I open the test assistant page
    When I fill out the generator form
    And I choose to generate test cases in JSON format
    And I enter valid JSON test format data
    And I generate test cases
   # Then I should see the generated test cases
