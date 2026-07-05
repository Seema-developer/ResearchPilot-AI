# app/agent.py
import os
import google.auth
from google.adk.agents import Agent
from google.adk.apps import App
from google.adk.models import Gemini
from google.genai import types

from app.app_utils.paper_db import search_papers
from skills.research_analyzer.analysis_tools import format_bibtex

# Initialize Google Cloud environment for Vertex AI / Gemini
try:
    _, project_id = google.auth.default()
    os.environ["GOOGLE_CLOUD_PROJECT"] = project_id
    os.environ["GOOGLE_CLOUD_LOCATION"] = "global"
    os.environ["GOOGLE_GENAI_USE_VERTEXAI"] = "True"
except Exception:
    # Fallback default configuration
    os.environ["GOOGLE_CLOUD_PROJECT"] = "mock-project"

# Base Gemini model config
model_instance = Gemini(
    model="gemini-flash-latest",
    retry_options=types.HttpRetryOptions(attempts=2),
)

# 1. Search Agent
search_agent = Agent(
    name="search_agent",
    model=model_instance,
    instruction=(
        "You are the Search Agent of ResearchPilot AI. Your job is to search the academic databases. "
        "Use the search_papers tool to retrieve papers related to the query. "
        "Provide a clean structured list of matching papers, including their title, authors, year, and abstract."
    ),
    tools=[search_papers],
)

# 2. Summarizer Agent
summarizer_agent = Agent(
    name="summarizer_agent",
    model=model_instance,
    instruction=(
        "You are the Summarizer Agent. Synthesize findings from literature. "
        "Summarize each paper by highlighting: 1) Model architecture, 2) Objectives, 3) Key results."
    ),
)

# 3. Gap Finder Agent
gap_finder_agent = Agent(
    name="gap_finder_agent",
    model=model_instance,
    instruction=(
        "You are the Gap Finder Agent. Analyze the literature summaries and identify 2-3 research gaps "
        "or limitations that have not been fully addressed."
    ),
)

# 4. Experiment Agent
experiment_agent = Agent(
    name="experiment_agent",
    model=model_instance,
    instruction=(
        "You are the Experiment Agent. Propose a structured methodology to address the identified research gaps. "
        "Detail: Proposed model, explainability framework (e.g., LIME/SHAP/IG), evaluation metrics, and a 3-step timeline."
    ),
)

# 5. Citation Agent
citation_agent = Agent(
    name="citation_agent",
    model=model_instance,
    instruction=(
        "You are the Citation Agent. Generate clean BibTeX bibliographical records for each paper using the format_bibtex tool. "
        "Strictly Prohibited: Do NOT include any 'publisher' field or string containing 'Mock' or 'ResearchPilot AI Mock Academic Index' in the BibTeX block. "
        "Since these are live arXiv preprints, format the journal field as 'arXiv preprint arXiv:[id]' and omit the publisher tag completely."
    ),
    tools=[format_bibtex],
)

# 6. Supervisor Agent (Orchestrator)
supervisor_agent = Agent(
    name="supervisor_agent",
    model=model_instance,
    instruction=(
        "You are the Supervisor Agent of ResearchPilot AI. You orchestrate the research workflow. "
        "You guide the user query through searching, summarizing, gap finding, and experiment design stages."
    ),
)

# Bundle into an ADK App
app = App(
    root_agent=supervisor_agent,
    name="research_pilot_app",
)
