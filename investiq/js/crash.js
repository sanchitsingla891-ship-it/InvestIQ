// js/crash.js — Crash Replay engine

let crChart = null;
let crInterval = null;
let crCurrentDay = 0;
let crPaused = false;
let crActive = false;
let crUserPortfolio = 100000;
let crSoldOut = false;
let crDecisionsLocal = [];
let crCheckpointsShown = { 10: false, 20: false, 30: false };

function renderCrashSelector() {
  const sel = document.getElementById('crash-selector');
  if (!sel) return;
  sel.innerHTML = Object.entries(CRASHES).map(([id, c]) => {
    const done = STATE.crashReplayed.includes(id);
    return `<div class="crash-card ${STATE.selectedCrash === id ? 'selected' : ''}" onclick="selectCrash('${id}')">
      <div class="cc-name">${c.name}</div>
      <div class="cc-drop">${c.drop}</div>
      <div class="cc-period">${c.period}</div>
      <div class="cc-status">${done ? '<span class="badge badge-green">Completed ✓</span>' : '<span class="badge badge-purple">Available</span>'}</div>
    </div>`;
  }).join('');
}

function selectCrash(id) {
  STATE.selectedCrash = id;
  renderCrashSelector();
  const crash = CRASHES[id];
  document.getElementById('cr-name').textContent = crash.name;
  document.getElementById('cr-desc').textContent = crash.desc;
  document.getElementById('crash-replay-area').style.display = 'block';
  resetCrashReplay(false);
  initCRChart();
}

function initCRChart() {
  const ctx = document.getElementById('cr-chart');
  if (!ctx) return;
  if (crChart) { crChart.destroy(); crChart = null; }
  const cfg = buildChartDefaults(['Day 1'], [
    { label: 'Your portfolio', data: [100000], borderColor: '#7c6af7', borderWidth: 2, pointRadius: 0, tension: 0.3, fill: false },
    { label: 'Disciplined (hold)', data: [100000], borderColor: '#22d98a', borderWidth: 1.5, borderDash: [4, 4], pointRadius: 0, tension: 0.3, fill: false }
  ]);
  crChart = new Chart(ctx, cfg);
}

function startCrashReplay() {
  if (crActive || !STATE.selectedCrash) return;
  crActive = true;
  crPaused = false;
  document.getElementById('cr-start-btn').disabled = true;
  document.getElementById('cr-pause-btn').disabled = false;
  document.getElementById('cr-debrief-area').innerHTML = '';
  crInterval = setInterval(crTick, 130);
}

function crTick() {
  if (crPaused || !crActive) return;
  const crash = CRASHES[STATE.selectedCrash];
  if (crCurrentDay >= crash.data.length) { endCrashReplay(); return; }

  const baseVal = crash.data[0];
  const curVal = crash.data[crCurrentDay];
  const ratio = curVal / baseVal;
  const disciplinedPort = Math.round(100000 * ratio);

  if (!crSoldOut) crUserPortfolio = disciplinedPort;

  crChart.data.labels.push('D' + (crCurrentDay + 1));
  crChart.data.datasets[0].data.push(Math.round(crUserPortfolio));
  crChart.data.datasets[1].data.push(disciplinedPort);
  crChart.update('none');

  const drop = Math.round((1 - ratio) * 100);
  const el = id => document.getElementById(id);
  el('cr-day').textContent = crCurrentDay + 1;
  el('cr-port').textContent = formatINR(crUserPortfolio);
  el('cr-port').className = crUserPortfolio < 100000 ? 'text-red' : 'text-green';
  el('cr-change').textContent = (ratio < 1 ? '−' : '+') + Math.abs(((ratio - 1) * 100).toFixed(1)) + '%';
  el('cr-change').style.color = ratio < 1 ? 'var(--red)' : 'var(--green)';
  el('cr-progress').style.width = Math.round((crCurrentDay + 1) / crash.data.length * 100) + '%';

  if (crash.events && crash.events[crCurrentDay]) {
    el('cr-event').textContent = 'Day ' + (crCurrentDay + 1) + ': ' + crash.events[crCurrentDay];
    el('cr-event').style.color = 'var(--amber)';
  }

  // Crash checkpoints
  if (drop >= 10 && !crCheckpointsShown[10]) { crCheckpointsShown[10] = true; showCrashCheckpoint(10, crUserPortfolio); }
  else if (drop >= 20 && !crCheckpointsShown[20]) { crCheckpointsShown[20] = true; showCrashCheckpoint(20, crUserPortfolio); }
  else if (drop >= 30 && !crCheckpointsShown[30] && crash.drop !== '−27%') { crCheckpointsShown[30] = true; showCrashCheckpoint(30, crUserPortfolio); }

  crCurrentDay++;
}

function showCrashCheckpoint(dropPct, portVal) {
  crPaused = true;
  clearInterval(crInterval);
  document.getElementById('cp-drop-pct').textContent = '−' + dropPct + '%';
  document.getElementById('cp-value-text').textContent = 'Your ₹1,00,000 is now ' + formatINR(portVal);
  document.getElementById('cp-context').textContent = CP_CONTEXTS[dropPct] || 'Markets are falling hard. What do you do?';
  document.getElementById('cp-peer-stat').textContent = PEER_STATS[dropPct];

  const choices = [
    { text: 'Sell everything — protect remaining capital', type: 'panic_sell' },
    { text: 'Sell half — reduce losses partially', type: 'sell_half' },
    { text: 'Hold — stay the course', type: 'hold' },
    { text: 'Buy more — averaging down', type: 'buy_more' }
  ];
  document.getElementById('cp-choices').innerHTML = choices.map(c =>
    `<button class="cp-choice" onclick="makeCrashDecision('${c.type}',${dropPct},${Math.round(portVal)})">${c.text}</button>`
  ).join('');
  document.getElementById('checkpoint-modal').classList.add('show');
}

function makeCrashDecision(type, dropPct, portVal) {
  crDecisionsLocal.push({ type, dropPct, portVal });
  STATE.crashDecisions.push({ type, dropPct, portVal });
  const isPanic = type === 'panic_sell' || type === 'sell_half';
  document.getElementById('checkpoint-modal').classList.remove('show');
  if (isPanic) {
    crSoldOut = (type === 'panic_sell');
    if (type === 'panic_sell') crUserPortfolio = portVal;
    else crUserPortfolio = portVal + (100000 - portVal) / 2;
    document.getElementById('cr-event').textContent = `⚠ You sold at −${dropPct}%. The market recovers — but you've locked in this loss.`;
    document.getElementById('cr-event').style.color = 'var(--red)';
  } else {
    document.getElementById('cr-event').textContent = `✓ You held. This is exactly what disciplined long-term investors do.`;
    document.getElementById('cr-event').style.color = 'var(--green)';
  }
  crPaused = false;
  crInterval = setInterval(crTick, 130);
}

function toggleCrashPause() {
  crPaused = !crPaused;
  const btn = document.getElementById('cr-pause-btn');
  if (crPaused) { clearInterval(crInterval); btn.textContent = 'Resume'; }
  else { crInterval = setInterval(crTick, 130); btn.textContent = 'Pause'; }
}

function resetCrashReplay(showToastMsg = true) {
  clearInterval(crInterval);
  crActive = false; crPaused = false; crCurrentDay = 0;
  crUserPortfolio = 100000; crSoldOut = false;
  crDecisionsLocal = [];
  crCheckpointsShown = { 10: false, 20: false, 30: false };

  const el = id => document.getElementById(id);
  el('cr-start-btn').disabled = false;
  el('cr-pause-btn').disabled = true;
  el('cr-pause-btn').textContent = 'Pause';
  el('cr-debrief-area').innerHTML = '';
  el('cr-event').textContent = 'Replay ready. Press Start to begin.';
  el('cr-event').style.color = 'var(--amber)';
  el('cr-day').textContent = '1';
  el('cr-port').textContent = '₹1,00,000';
  el('cr-change').textContent = '0%';
  el('cr-progress').style.width = '0%';

  if (crChart) {
    crChart.data.labels = ['Day 1'];
    crChart.data.datasets.forEach(d => d.data = [100000]);
    crChart.update();
  }
  if (showToastMsg) showToast('Crash replay reset.', 'info');
}

async function endCrashReplay() {
  clearInterval(crInterval);
  crActive = false;
  document.getElementById('cr-start-btn').disabled = false;
  document.getElementById('cr-pause-btn').disabled = true;

  const crash = CRASHES[STATE.selectedCrash];
  const baseVal = crash.data[0];
  const finalVal = crash.data[crash.data.length - 1];
  const disciplinedFinal = Math.round(100000 * finalVal / baseVal);
  const panicCount = crDecisionsLocal.filter(d => d.type === 'panic_sell' || d.type === 'sell_half').length;
  const holdCount = crDecisionsLocal.filter(d => d.type === 'hold' || d.type === 'buy_more').length;

  if (!STATE.crashReplayed.includes(STATE.selectedCrash)) {
    STATE.crashReplayed.push(STATE.selectedCrash);
    STATE.crashesSurvived++;
    STATE.milestones.survived_crash = true;
  }
  if (STATE.simulationsDone >= 2) STATE.milestones.completed_two_sims = true;

  let verdict, biasTagsHTML;
  if (panicCount > holdCount) {
    STATE.disciplineScore = Math.max(0, STATE.disciplineScore - 15);
    verdict = `You sold during the crash — locking in real losses. The disciplined investor who held recovered fully. Difference: ${formatINR(disciplinedFinal - crUserPortfolio)}. This is exactly what loss aversion costs over time.`;
    biasTagsHTML = '<span class="badge badge-red">Loss aversion</span> <span class="badge badge-amber">Recency bias</span>';
  } else {
    STATE.disciplineScore = Math.min(100, STATE.disciplineScore + 10);
    verdict = `You held through one of the worst market events in Indian history. Discipline score +10. In real investing, this behavior — holding through fear — is what separates wealth-builders from panic-sellers.`;
    biasTagsHTML = '<span class="badge badge-green">Discipline demonstrated</span> <span class="badge badge-green">Held through panic</span>';
  }

  // Try AI debrief
  let aiDebriefHTML = `<div class="debrief-text"><p>${verdict}</p></div>`;
  try {
    const aiText = await generateDebrief({
      profile: STATE.fearProfile ? PROFILES[STATE.fearProfile].name : 'Unknown',
      biasScores: STATE.biasScores,
      decisions: crDecisionsLocal,
      disciplineScore: STATE.disciplineScore,
      crashesSurvived: STATE.crashesSurvived,
      simulationsDone: STATE.simulationsDone
    });
    aiDebriefHTML = `<div class="debrief-text">${aiText.split('\n\n').filter(Boolean).map(p => `<p>${p}</p>`).join('')}</div>`;
  } catch { /* use static verdict */ }

  document.getElementById('cr-debrief-area').innerHTML = `
    <div class="card mt-16">
      <div class="sec-label">Behavioral Debrief — ${crash.shortName}</div>
      <div class="debrief-compare">
        <div class="dc-box dc-you">
          <div class="dc-label">Your outcome</div>
          <div class="dc-val">${formatINR(crUserPortfolio)}</div>
        </div>
        <div class="dc-box dc-disc">
          <div class="dc-label">Disciplined investor</div>
          <div class="dc-val">${formatINR(disciplinedFinal)}</div>
        </div>
      </div>
      ${aiDebriefHTML}
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:12px 0;">${biasTagsHTML}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-sm btn-secondary" onclick="resetCrashReplay()">Try Again</button>
        <button class="btn btn-sm btn-primary" onclick="navToPage('debrief')">View Bias Report →</button>
      </div>
    </div>`;

  renderCrashSelector();
}
