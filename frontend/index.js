let activeSessionId = null;
let pollingInterval = null;
let currentLogsCount = 0;

// DOM Elements
const inputView = document.getElementById('inputView');
const pipelineView = document.getElementById('pipelineView');
const queryInput = document.getElementById('queryInput');
const startResearchBtn = document.getElementById('startResearchBtn');
const newSessionBtn = document.getElementById('newSessionBtn');
const sessionsList = document.getElementById('sessionsList');
const activeQueryTitle = document.getElementById('activeQueryTitle');
const consoleLogs = document.getElementById('consoleLogs');

// Tab body sections
const reportSummaries = document.getElementById('reportSummaries');
const reportGaps = document.getElementById('reportGaps');
const reportFuture = document.getElementById('reportFuture');
const reportCitations = document.getElementById('reportCitations');

// Stats Counters
const statPapers = document.getElementById('statPapers');
const statGaps = document.getElementById('statGaps');

// Triage Elements
const triageBox = document.getElementById('triageBox');
const triageStatusBadge = document.getElementById('triageStatusBadge');
const methodologyEditor = document.getElementById('methodologyEditor');
const approveMethodologyBtn = document.getElementById('approveMethodologyBtn');
const requestRevisionBtn = document.getElementById('requestRevisionBtn');

// Helper to format text with simple markdown-to-html converter
function formatMarkdown(text) {
  if (!text) return '<p class="placeholder-text">Synthesizing report, please wait...</p>';
  
  // Format numbered lists
  let formatted = text.replace(/^\d+\.\s+\*\*(.*?)\*\*:\s*(.*?)$/gm, '<h3>$1</h3><p>$2</p>');
  
  // Format bullet points
  formatted = formatted.replace(/^-\s+\*\*(.*?)\*\*:\s*(.*?)$/gm, '<h4>$1</h4><p>$2</p>');
  formatted = formatted.replace(/^-\s+(.*?)$/gm, '<li>$1</li>');
  formatted = formatted.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
  
  // Format section titles
  formatted = formatted.replace(/^###\s+(.*?)$/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^####\s+(.*?)$/gm, '<h4>$1</h4>');
  
  // Format paragraph line breaks
  formatted = formatted.replace(/\n\n/g, '</p><p>');
  
  if (!formatted.startsWith('<')) {
    formatted = '<p>' + formatted + '</p>';
  }
  return formatted;
}

// Fetch all sessions to populate the sidebar list
async function loadRecentSessions() {
  try {
    const res = await fetch('/api/sessions');
    const sessions = await res.json();
    
    sessionsList.innerHTML = '';
    if (sessions.length === 0) {
      sessionsList.innerHTML = '<li class="empty-state">No recent sessions</li>';
      return;
    }
    
    // Count totals for stats
    let totalPapers = 0;
    let totalGaps = 0;
    
    sessions.forEach(s => {
      const li = document.createElement('li');
      li.textContent = s.query;
      li.dataset.id = s.session_id;
      if (activeSessionId === s.session_id) {
        li.classList.add('active');
      }
      
      li.addEventListener('click', () => selectSession(s.session_id));
      sessionsList.appendChild(li);
      
      if (s.status === 'completed' || s.status === 'pending_triage') {
        totalPapers += s.papers.length;
        if (s.gaps) totalGaps += 2; // Simulated count
      }
    });
    
    statPapers.textContent = totalPapers;
    statGaps.textContent = totalGaps;
  } catch (err) {
    console.error("Error loading sessions:", err);
  }
}

// Select a session from history
async function selectSession(sessionId) {
  if (pollingInterval) clearInterval(pollingInterval);
  activeSessionId = sessionId;
  currentLogsCount = 0;
  
  // UI highlight
  document.querySelectorAll('#sessionsList li').forEach(li => {
    li.classList.remove('active');
    if (li.dataset.id === sessionId) li.classList.add('active');
  });
  
  // Switch to workspace view
  inputView.classList.add('hidden');
  pipelineView.classList.remove('hidden');
  
  await updateSessionUI();
  
  // Poll if session is active/running
  pollSessionStatus();
  pollingInterval = setInterval(pollSessionStatus, 1500);
}

// Post request to run research
async function startResearch(query) {
  if (!query.trim()) return;
  
  try {
    startResearchBtn.disabled = true;
    startResearchBtn.textContent = 'Launching...';
    
    const res = await fetch('/api/research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });
    const data = await res.json();
    
    activeSessionId = data.session_id;
    activeQueryTitle.textContent = query;
    currentLogsCount = 0;
    
    // Clear display
    consoleLogs.innerHTML = '<div class="console-row system">Initializing pipeline listener...</div>';
    resetReportDisplays();
    resetStepperUI();
    resetTriageUI();
    
    inputView.classList.add('hidden');
    pipelineView.classList.remove('hidden');
    
    await loadRecentSessions();
    
    // Start Polling
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(pollSessionStatus, 1500);
    
    startResearchBtn.disabled = false;
    startResearchBtn.innerHTML = `Run Pipeline <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>`;
  } catch (err) {
    console.error("Error starting research:", err);
    startResearchBtn.disabled = false;
  }
}

// Reset UI helpers
function resetReportDisplays() {
  reportSummaries.innerHTML = '<p class="placeholder-text">Synthesizing literature summaries, please wait...</p>';
  reportGaps.innerHTML = '<p class="placeholder-text">Analyzing gaps, please wait...</p>';
  reportFuture.innerHTML = '<p class="placeholder-text">Formulating future directives, please wait...</p>';
  reportCitations.textContent = 'Waiting for citations builder...';
}

function resetStepperUI() {
  const steps = ['searching', 'summarizing', 'finding_gaps', 'planning_experiments', 'citations'];
  steps.forEach(st => {
    const el = document.getElementById(`step-${st}`);
    if (el) el.className = 'step';
  });
}

function resetTriageUI() {
  triageStatusBadge.textContent = 'Waiting';
  triageStatusBadge.className = 'triage-status';
  methodologyEditor.value = '';
  methodologyEditor.disabled = true;
  approveMethodologyBtn.disabled = true;
  requestRevisionBtn.disabled = true;
}

// Updates UI metrics, report fields, and triage boxes based on fetched session
async function updateSessionUI() {
  if (!activeSessionId) return;
  
  try {
    const res = await fetch(`/api/sessions/${activeSessionId}`);
    if (res.status === 404) {
      clearInterval(pollingInterval);
      return;
    }
    const session = await res.json();
    
    activeQueryTitle.textContent = session.query;
    
    // 1. Update logs
    if (session.logs.length > currentLogsCount) {
      for (let i = currentLogsCount; i < session.logs.length; i++) {
        const div = document.createElement('div');
        div.className = 'console-row log';
        
        // Color highlights based on agent
        const logText = session.logs[i];
        if (logText.includes('[Search Agent]')) {
          div.innerHTML = `<span style="color: var(--cyan)">${logText}</span>`;
        } else if (logText.includes('[Summarizer Agent]')) {
          div.innerHTML = `<span style="color: var(--purple)">${logText}</span>`;
        } else if (logText.includes('[Gap Finder Agent]')) {
          div.innerHTML = `<span style="color: var(--violet)">${logText}</span>`;
        } else if (logText.includes('[Experiment Agent]')) {
          div.innerHTML = `<span style="color: var(--amber)">${logText}</span>`;
        } else if (logText.includes('[Citation Agent]')) {
          div.innerHTML = `<span style="color: #00E5FF">${logText}</span>`;
        } else if (logText.includes('[Supervisor]')) {
          div.innerHTML = `<span style="color: #B5A5FF; font-weight: 500">${logText}</span>`;
        } else {
          div.textContent = logText;
        }
        
        consoleLogs.appendChild(div);
      }
      currentLogsCount = session.logs.length;
      consoleLogs.scrollTop = consoleLogs.scrollHeight;
    }
    
    // 2. Update stepper
    updateStepperProgress(session.status);
    
    // 3. Populate report documents
    if (session.summaries) {
      let summariesHTML = '';
      if (session.papers && session.papers.length > 0) {
        summariesHTML += '<div class="papers-list-header" style="margin-bottom: 16px; font-weight: 600; font-size: 16px; color: var(--cyan);">Retrieved arXiv Papers:</div>';
        session.papers.forEach((paper, index) => {
          const pdfUrl = paper.pdf_url || `https://arxiv.org/pdf/${paper.id}.pdf`;
          summariesHTML += `
            <div class="paper-card-container" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 20px; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              <h4 style="color: var(--cyan); margin-bottom: 6px; font-size: 15px; font-family: 'Space Grotesk', sans-serif;">${index + 1}. ${paper.title}</h4>
              <div style="font-size: 13px; color: var(--text-secondary); margin-bottom: 8px;"><strong>Authors:</strong> ${paper.authors} | <strong>Year:</strong> ${paper.year}</div>
              <p style="font-size: 12px; color: var(--text-muted); line-height: 1.5; margin-bottom: 16px;">${paper.abstract}</p>
              <div style="display: flex; gap: 12px; align-items: center;">
                <a href="${pdfUrl}" target="_blank" class="btn-pdf-download" style="display: inline-flex; align-items: center; gap: 8px; background: linear-gradient(135deg, rgba(0, 240, 255, 0.1) 0%, rgba(123, 97, 255, 0.1) 100%); border: 1px solid var(--cyan); color: var(--cyan); border-radius: 8px; padding: 8px 16px; font-size: 12px; text-decoration: none; font-weight: 600; cursor: pointer; transition: all 0.2s ease; box-shadow: 0 0 10px rgba(0, 240, 255, 0.1);">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="vertical-align: middle;"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                  [Download Research Paper PDF]
                </a>
              </div>
            </div>
          `;
        });
        summariesHTML += '<div class="review-header" style="margin-top: 32px; margin-bottom: 16px; font-weight: 600; font-size: 16px; color: var(--purple);">Literature Review Synthesis:</div>';
        
        // Update papers counter in sidebar to exact retrieved papers count
        statPapers.textContent = session.papers.length;
      }
      reportSummaries.innerHTML = summariesHTML + formatMarkdown(session.summaries);
    }
    
    if (session.gaps) reportGaps.innerHTML = formatMarkdown(session.gaps);
    if (session.methodology) {
      reportFuture.innerHTML = formatMarkdown(session.future_work);
      
      // Load triage editor if user hasn't modified it yet
      if (!methodologyEditor.disabled && document.activeElement === methodologyEditor) {
        // User is editing, don't overwrite
      } else {
        methodologyEditor.value = session.methodology;
      }
    }
    if (session.citations) reportCitations.textContent = session.citations;
    
    // 4. Update Triage status panel
    if (session.status === 'pending_triage') {
      triageStatusBadge.textContent = 'Pending Review';
      triageStatusBadge.className = 'triage-status pending';
      methodologyEditor.disabled = false;
      approveMethodologyBtn.disabled = false;
      requestRevisionBtn.disabled = false;
    } else if (session.status === 'completed') {
      triageStatusBadge.textContent = 'Finalized';
      triageStatusBadge.className = 'triage-status completed';
      methodologyEditor.disabled = true;
      approveMethodologyBtn.disabled = true;
      requestRevisionBtn.disabled = true;
      clearInterval(pollingInterval);
    } else if (session.status === 'failed') {
      triageStatusBadge.textContent = 'Failed';
      triageStatusBadge.className = 'triage-status';
      methodologyEditor.disabled = true;
      clearInterval(pollingInterval);
    }
  } catch (err) {
    console.error("Error updating UI:", err);
  }
}

async function pollSessionStatus() {
  await updateSessionUI();
}

// Steps progression UI logic
function updateStepperProgress(status) {
  const steps = ['searching', 'summarizing', 'finding_gaps', 'planning_experiments', 'citations'];
  const statusIdx = steps.indexOf(status);
  
  steps.forEach((st, idx) => {
    const el = document.getElementById(`step-${st}`);
    if (!el) return;
    
    if (status === 'completed') {
      el.className = 'step completed';
    } else if (idx < statusIdx) {
      el.className = 'step completed';
    } else if (idx === statusIdx) {
      el.className = 'step active';
    } else {
      el.className = 'step';
    }
  });
}

// Triage Action Handlers
async function submitTriageAction(action) {
  if (!activeSessionId) return;
  
  approveMethodologyBtn.disabled = true;
  requestRevisionBtn.disabled = true;
  
  try {
    const res = await fetch(`/api/sessions/${activeSessionId}/triage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        methodology: methodologyEditor.value,
        action: action
      })
    });
    
    const session = await res.json();
    
    // Update local list for finalized stats
    await loadRecentSessions();
    
    // Resume polling to watch transition
    if (pollingInterval) clearInterval(pollingInterval);
    pollingInterval = setInterval(pollSessionStatus, 1500);
    
    await updateSessionUI();
  } catch (err) {
    console.error("Error submitting triage:", err);
    approveMethodologyBtn.disabled = false;
    requestRevisionBtn.disabled = false;
  }
}

// Event Listeners
startResearchBtn.addEventListener('click', () => {
  startResearch(queryInput.value);
});

queryInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    startResearch(queryInput.value);
  }
});

newSessionBtn.addEventListener('click', () => {
  if (pollingInterval) clearInterval(pollingInterval);
  activeSessionId = null;
  resetReportDisplays();
  resetStepperUI();
  resetTriageUI();
  
  queryInput.value = '';
  
  // Highlight removal
  document.querySelectorAll('#sessionsList li').forEach(li => li.classList.remove('active'));
  
  pipelineView.classList.add('hidden');
  inputView.classList.remove('hidden');
});

// Suggestions Tags
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    queryInput.value = btn.textContent;
    startResearch(btn.textContent);
  });
});

// Results tabs toggle
document.querySelectorAll('.tabs-header .tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tabs-header .tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    btn.classList.add('active');
    const tabId = btn.dataset.tab;
    document.getElementById(tabId).classList.add('active');
  });
});

// Triage button actions
approveMethodologyBtn.addEventListener('click', () => submitTriageAction('approve'));
requestRevisionBtn.addEventListener('click', () => submitTriageAction('reject'));

// Page Init
loadRecentSessions();
