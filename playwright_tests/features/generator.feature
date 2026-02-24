Feature: Generator Agent

  Scenario: Generate a test plan
    Given I open the test assistant page
    When I fill out the generator form
    And I generate a test plan
    Then I should see the generated test plan
