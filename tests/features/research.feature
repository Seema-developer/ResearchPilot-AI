# tests/features/research.feature
Feature: Autonomous Research Synthesis and Planning
  As a researcher
  I want ResearchPilot AI to compile an academic report
  So that I can identify literature gaps and plan methodology

  Scenario: Research Synthesis output must be structured and contain proper bibliographical citations
    Given a research query "Explainable AI for Urdu LLMs"
    When the multi-agent research pipeline is executed
    Then the generated report should contain the literature summaries
    And the report should list at least 2 research gaps
    And the report should propose an experimental methodology
    And the report should provide future work recommendations
    And the citations should contain valid BibTeX entries starting with "@article"
