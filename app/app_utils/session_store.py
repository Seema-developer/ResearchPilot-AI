# app/app_utils/session_store.py
import uuid
import datetime

class ResearchSession:
    def __init__(self, query: str):
        self.session_id = str(uuid.uuid4())
        self.query = query
        self.created_at = datetime.datetime.now().isoformat()
        self.status = "searching"  # searching -> summarizing -> finding_gaps -> planning_experiments -> citations -> pending_triage -> completed
        self.logs = []
        self.papers = []
        self.summaries = ""
        self.gaps = ""
        self.methodology = ""
        self.future_work = ""
        self.citations = ""
        self.is_approved = False
        
    def add_log(self, agent_name: str, message: str):
        timestamp = datetime.datetime.now().strftime("%H:%M:%S")
        log_entry = f"[{timestamp}] [{agent_name}] {message}"
        self.logs.append(log_entry)
        
    def to_dict(self):
        return {
            "session_id": self.session_id,
            "query": self.query,
            "created_at": self.created_at,
            "status": self.status,
            "logs": self.logs,
            "papers": self.papers,
            "summaries": self.summaries,
            "gaps": self.gaps,
            "methodology": self.methodology,
            "future_work": self.future_work,
            "citations": self.citations,
            "is_approved": self.is_approved
        }

SESSIONS = {}

def create_session(query: str) -> ResearchSession:
    session = ResearchSession(query)
    SESSIONS[session.session_id] = session
    return session

def get_session(session_id: str) -> ResearchSession:
    return SESSIONS.get(session_id)

def get_all_sessions() -> list:
    return [s.to_dict() for s in sorted(SESSIONS.values(), key=lambda x: x.created_at, reverse=True)]
