---
name: research_analyzer
description: A specialized skill to analyze academic papers, detect literature gaps, plan experimental methodologies, and format citations.
---

# Research Analyzer Skill

This skill guides the ResearchPilot AI agents to perform systematic review and methodology drafting. When analyzing research queries:

## 1. Literature Synthesis Guidelines
- Synthesize findings from multiple papers into a cohesive narrative.
- Summarize each paper focusing on:
  - Model architecture (e.g. Transformers, BERT, LLMs).
  - Main objectives and achievements.
  - Evaluation results (accuracy, BLEU, F1 score).
- Compare and contrast the different approaches.

## 2. Research Gap Discovery Rules
- Look for gaps in:
  - Low-resource language evaluations (e.g., dialect variations, orthographic representation).
  - Model interpretability (post-hoc explanation limits, local explanations vs. global).
  - Resource constraints (hardware, datasets).
  - Validation metrics (lack of human evaluation, bias in automated evaluation).

## 3. Methodology & Research Planning Guidelines
- Design a structured, reproducible experiment containing:
  - **Proposed Model:** Specify base architecture (e.g., fine-tuning `UrduLLM-7B`).
  - **Explainability Framework:** Detail post-hoc tools (e.g., Layer Integrated Gradients, KernelSHAP, or Attention Visualizations).
  - **Evaluation Metric:** Define both automated (fidelity, stability) and human validation processes.
  - **Timeline:** Present a 3-step project implementation timeline.

## 4. Citation Formatting Standard
- Format bibliography as structured BibTeX entries.
- Use key template: `@article{authorYearKey, title={...}, author={...}, journal={...}, year={...}}`.
