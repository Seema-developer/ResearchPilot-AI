# app/app_utils/paper_db.py
import re
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET

def search_arxiv(query: str, limit: int = 8) -> list:
    """Queries real-world arXiv API for peer-reviewed academic papers.
    Uses a self-healing search fallback to broaden queries if initial specific searches yield no results.
    """
    limit = max(5, min(10, limit))
    clean_query = re.sub(r'[^a-zA-Z0-9\s]', '', query)
    
    # Filter common stopwords
    stopwords = {"for", "in", "to", "on", "and", "of", "with", "the", "a", "an", "at", "by", "is", "it"}
    words = [t for t in clean_query.split() if t.lower() not in stopwords]
    
    if not words:
        words = ["explainable", "ai"]
        
    papers = []
    attempts = 0
    max_attempts = len(words) - 1
    
    while not papers and attempts <= max_attempts:
        active_words = words[:len(words) - attempts]
        
        # Avoid searching for single letters or too few terms if we started with more
        if len(active_words) < 2 and len(words) >= 2:
            break
            
        search_term = "+".join([urllib.parse.quote(w) for w in active_words])
        url = f"http://export.arxiv.org/api/query?search_query=all:{search_term}&max_results={limit}&sortBy=relevance&sortOrder=descending"
        
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=8) as response:
                xml_data = response.read()
                
            root = ET.fromstring(xml_data)
            namespaces = {
                'atom': 'http://www.w3.org/2005/Atom'
            }
            
            for entry in root.findall('atom:entry', namespaces):
                title_el = entry.find('atom:title', namespaces)
                summary_el = entry.find('atom:summary', namespaces)
                id_el = entry.find('atom:id', namespaces)
                published_el = entry.find('atom:published', namespaces)
                
                title = title_el.text.strip().replace('\n', ' ') if title_el is not None else "Unknown Title"
                summary = summary_el.text.strip().replace('\n', ' ') if summary_el is not None else "No abstract available"
                id_url = id_el.text.strip() if id_el is not None else "http://arxiv.org/abs/placeholder"
                published = published_el.text if published_el is not None else "2026-01-01"
                
                authors_list = []
                for author in entry.findall('atom:author', namespaces):
                    name_el = author.find('atom:name', namespaces)
                    if name_el is not None:
                        authors_list.append(name_el.text.strip())
                authors = ", ".join(authors_list) if authors_list else "Unknown Authors"
                
                year = int(published[:4]) if published else 2026
                arxiv_id = id_url.split('/abs/')[-1] if '/abs/' in id_url else "arxiv"
                pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
                
                papers.append({
                    "id": arxiv_id,
                    "title": title,
                    "authors": authors,
                    "year": year,
                    "abstract": summary,
                    "pdf_url": pdf_url,
                    "keywords": ["arxiv", "live-search"],
                    "citation": f"{authors} ({year}). {title}. arXiv preprint: {id_url}"
                })
        except Exception as e:
            print(f"arXiv search attempt failed for term '{search_term}': {e}")
            
        attempts += 1
        
    # If all progressive sub-searches failed, try a final broad keyword
    if not papers:
        try:
            url = f"http://export.arxiv.org/api/query?search_query=all:explainable+AI&max_results={limit}&sortBy=relevance&sortOrder=descending"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=8) as response:
                xml_data = response.read()
            root = ET.fromstring(xml_data)
            namespaces = {'atom': 'http://www.w3.org/2005/Atom'}
            for entry in root.findall('atom:entry', namespaces):
                title_el = entry.find('atom:title', namespaces)
                summary_el = entry.find('atom:summary', namespaces)
                id_el = entry.find('atom:id', namespaces)
                published_el = entry.find('atom:published', namespaces)
                title = title_el.text.strip().replace('\n', ' ') if title_el is not None else "Unknown Title"
                summary = summary_el.text.strip().replace('\n', ' ') if summary_el is not None else "No abstract available"
                id_url = id_el.text.strip() if id_el is not None else "http://arxiv.org"
                published = published_el.text if published_el is not None else "2026-01-01"
                authors_list = [author.find('atom:name', namespaces).text.strip() for author in entry.findall('atom:author', namespaces) if author.find('atom:name', namespaces) is not None]
                authors = ", ".join(authors_list) if authors_list else "Unknown Authors"
                year = int(published[:4]) if published else 2026
                arxiv_id = id_url.split('/abs/')[-1] if '/abs/' in id_url else "arxiv"
                pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"
                
                papers.append({
                    "id": arxiv_id,
                    "title": title,
                    "authors": authors,
                    "year": year,
                    "abstract": summary,
                    "pdf_url": pdf_url,
                    "keywords": ["arxiv", "live-search"],
                    "citation": f"{authors} ({year}). {title}. arXiv preprint: {id_url}"
                })
        except Exception as e:
            print(f"Fallback arXiv search failed: {e}")
            raise Exception("No papers could be retrieved from the live arXiv API portal.")
            
    return papers[:limit]

def search_papers(query: str, limit: int = 8) -> list:
    """Searches papers strictly on arXiv. Returns between 5 and 10 results. No local database fallback."""
    limit = max(5, min(10, limit))
    return search_arxiv(query, limit)
