# skills/research_analyzer/analysis_tools.py
import re

def format_bibtex(paper_id: str, title: str, authors: str, journal: str, year: int) -> str:
    """Formats paper metadata into a clean BibTeX citation string."""
    # Create bibkey (e.g. khan2025urdullm)
    first_author = authors.split(",")[0].strip().lower().replace(" ", "")
    clean_title_first_word = re.sub(r'[^a-zA-Z0-9]', '', title.split(" ")[0].lower())
    bibkey = f"{first_author}{year}{clean_title_first_word}"
    
    bibtex = f"""@article{{{bibkey},
  title={{{title}}},
  author={{{authors}}},
  journal={{{journal}}},
  year={{{year}}}
}}"""
    return bibtex

def extract_research_keywords(query: str) -> list:
    """Helper to extract significant keywords from user research queries, ignoring stop words."""
    stopwords = {"explainable", "explainability", "for", "in", "a", "an", "the", "to", "on", "and", "of", "with", "applying", "methods", "visualizing", "framework"}
    words = re.findall(r'\w+', query.lower())
    keywords = [w for w in words if w not in stopwords]
    return keywords
