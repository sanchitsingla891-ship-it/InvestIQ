// js/fincheck.js — Finfluencer Myth Buster

async function analyzeFinfluencer() {
  const text = document.getElementById('fin-input').value.trim();
  if (!text) { showToast('Please paste a claim to analyze.', 'warn'); return; }

  const resultEl = document.getElementById('fin-result');
  resultEl.style.display = 'block';
  document.getElementById('fin-verdict').textContent = 'Gemini AI is analyzing this claim...';
  document.getElementById('fin-flags').innerHTML = '<li>Scanning for manipulation patterns...</li>';
  document.getElementById('fin-action').textContent = 'Please wait...';
  document.getElementById('fin-risk-badge').className = 'risk-badge risk-medium';
  document.getElementById('fin-risk-badge').textContent = 'ANALYZING...';

  try {
    const data = await analyzeClaim(text);
    renderFinResult(data);
  } catch (e) {
    renderFinResult(fallbackAnalysis(text));
  }
}

function renderFinResult(data) {
  const riskClass = data.risk_level === 'high' ? 'risk-high' : data.risk_level === 'medium' ? 'risk-medium' : 'risk-low';
  document.getElementById('fin-risk-badge').className = 'risk-badge ' + riskClass;
  document.getElementById('fin-risk-badge').textContent = data.risk_level.toUpperCase() + ' RISK';
  document.getElementById('fin-verdict').textContent = data.verdict;
  document.getElementById('fin-flags').innerHTML = (data.flags || []).map(f => `<li>${f}</li>`).join('');
  document.getElementById('fin-action').textContent = data.action;
}
