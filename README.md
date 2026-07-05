### 🧠 The Problem
Manual literature review and experimental planning take days. ResearchPilot AI automates the entire process of searching papers, creating summaries, and finding research gaps, while giving the user full approval control at the final step.

### 🛠️ What We Built
ResearchPilot AI is an autonomous workspace that runs specialized modules in a single loop:
* **Search:** Fetches papers directly from the live arXiv API.
* **Summarizer:** Creates structured literature summaries of the retrieved papers.
* **Gap Finder:** Analyzes data to find structural gaps and research limitations.
* **Experiment Agent:** Drafts grounded methodologies and evaluation metrics based on the papers.
* **Citation:** Converts all references into the standard BibTeX format.
* **Supervisor:** Orchestrates the workflow and pauses at the Triage step for user review to ensure full accuracy.

### 💻 Architecture & Tech Stack
* **Frontend:** Dark-mode glassmorphic interface built with HTML5, Bootstrap, and JavaScript.
* **Orchestration:** Programmatic loop execution using the `google.adk` framework.
* **LLM Core:** Powered by the Gemini API model logic tier.
* **Data Flow:** Live arXiv API integration with strict context grounding to block hallucinations.

### 📊 Results & Limitations
* **Status:** A working prototype that successfully fetches papers, generates summaries, and extracts gaps in test runs.
* **Limitations:** Search relevance depends on your query keywords, and generated drafts must be reviewed before real implementation.
