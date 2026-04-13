// js/app.js — Main app controller: page routing, rendering, dashboard, debrief, graduation

// ── PAGE TEMPLATES ─────────────────────────────────────────────────────────
const PAGE_TEMPLATES = {

  dashboard: () => `
    <div class="page active" id="page-dashboard">
      <div class="page-title">Dashboard</div>
      <div class="page-sub" id="dash-sub">Your investing fear progress and simulation stats.</div>
      <div class="welcome-banner">
        <div>
          <div style="font-family:var(--font-head);font-size:18px;font-weight:700;margin-bottom:4px;" id="dash-greeting">Welcome, Investor</div>
          <div style="font-size:12px;color:var(--text2);">Fear Profile: <span style="color:var(--accent2);" id="dash-profile-tag">—</span></div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;" id="dash-badges"></div>
        </div>
        <div style="text-align:center;flex-shrink:0;">
          <div class="discipline-ring">
            <svg width="70" height="70" viewBox="0 0 70 70">
              <circle cx="35" cy="35" r="28" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="6"/>
              <circle cx="35" cy="35" r="28" fill="none" stroke="#7c6af7" stroke-width="6"
                stroke-dasharray="175.9" id="discipline-circle" stroke-dashoffset="80" stroke-linecap="round"/>
            </svg>
            <span class="discipline-score-val" id="discipline-score-val">60</span>
          </div>
          <div style="font-size:10px;color:var(--text3);margin-top:4px;">Discipline</div>
        </div>
      </div>
      <div class="bias-alert" id="dash-bias-alert">
        <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" style="flex-shrink:0;margin-top:1px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
        <span id="dash-bias-text">Complete Fear Assessment to see your behavioral profile.</span>
      </div>
      <div class="grid-4 mb-20">
        <div class="stat-card"><div class="stat-label">Portfolio</div><div class="stat-value" id="dash-portfolio">₹1,00,000</div><div class="stat-change" id="dash-pnl">—</div></div>
        <div class="stat-card"><div class="stat-label">Simulations</div><div class="stat-value amber" id="dash-sims">0</div><div class="stat-change">of 5 total</div></div>
        <div class="stat-card"><div class="stat-label">Crashes Survived</div><div class="stat-value green" id="dash-crashes">0</div><div class="stat-change">of 4 available</div></div>
        <div class="stat-card"><div class="stat-label">Graduation</div><div class="stat-value purple" id="dash-grad-pct">0%</div><div class="stat-change" id="dash-grad-text">0 of 3 milestones</div></div>
      </div>
      <div class="grid-2">
        <div class="card">
          <div class="sec-label">Bias Profile</div>
          <div id="dash-bias-bars"><div style="font-size:12px;color:var(--text3);">Complete Fear Assessment to see your profile.</div></div>
        </div>
        <div class="card">
          <div class="sec-label">Graduation Milestones</div>
          <div id="milestone-list"></div>
        </div>
      </div>
    </div>`,

  sandbox: () => `
    <div class="page active" id="page-sandbox">
      <div class="page-title">Sandbox Simulator</div>
      <div class="page-sub">Practice with ₹1,00,000 virtual money. Real market movements. Zero real risk.</div>
      <div class="sandbox-header">
        <div class="flex-row">
          <div class="stat-card" style="padding:12px 16px;min-width:140px;"><div class="stat-label">Portfolio Value</div><div class="stat-value" id="sb-port-val">₹1,00,000</div></div>
          <div class="stat-card" style="padding:12px 16px;min-width:110px;"><div class="stat-label">Return</div><div class="stat-value" id="sb-return">0.0%</div></div>
          <div class="stat-card" style="padding:12px 16px;min-width:110px;"><div class="stat-label">Cash Left</div><div class="stat-value green" id="sb-cash">₹1,00,000</div></div>
          <div class="stat-card" style="padding:12px 16px;min-width:100px;"><div class="stat-label">Discipline</div><div class="stat-value purple" id="sb-discipline">60</div></div>
        </div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-sm btn-secondary" onclick="resetSandbox()">Reset</button>
          <button class="btn btn-sm btn-primary" id="sb-toggle-btn" onclick="toggleSandbox()">Start Simulation</button>
        </div>
      </div>
      <div class="sec-label">Live Market Prices — click to trade</div>
      <div class="price-grid" id="price-grid"></div>
      <div class="trade-panel" id="trade-panel" style="display:none;">
        <h4 id="trade-stock-name" style="font-size:13px;font-weight:600;margin-bottom:10px;">Select a stock</h4>
        <div style="font-size:12px;color:var(--text2);margin-bottom:10px;">Current price: <span style="color:var(--text);font-weight:600;" id="trade-price">—</span></div>
        <div class="qty-row">
          <label>Quantity</label>
          <input type="number" id="trade-qty" value="1" min="1" max="500" oninput="updateTradeTotal()" style="width:80px;">
          <span style="font-size:12px;color:var(--text2);">= <span id="trade-total" style="color:var(--text);font-weight:600;">—</span></span>
        </div>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn btn-success btn-sm" onclick="executeTrade('buy')">Buy</button>
          <button class="btn btn-danger btn-sm" onclick="executeTrade('sell')">Sell</button>
          <button class="btn btn-secondary btn-sm" onclick="closeTrade()">Cancel</button>
        </div>
      </div>
      <div class="card mb-16">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
          <div style="font-size:13px;font-weight:500;">Portfolio Performance</div>
          <div style="font-size:11px;color:var(--text3);" id="sb-timer-label">Simulation not started</div>
        </div>
        <div style="height:180px;"><canvas id="sb-chart"></canvas></div>
      </div>
      <div class="sec-label">Holdings</div>
      <div class="card" id="holdings-panel"><div style="font-size:12px;color:var(--text3);">No positions yet.</div></div>
    </div>`,

  crash: () => `
    <div class="page active" id="page-crash">
      <div class="page-title">Crash Replay</div>
      <div class="page-sub">Relive 4 real Indian market crashes. Make live decisions. See what discipline would have done differently.</div>
      <div class="sec-label">Choose a crash to experience</div>
      <div class="crash-selector" id="crash-selector"></div>
      <div id="crash-replay-area" style="display:none;">
        <div class="card mb-16">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
            <div>
              <div style="font-size:14px;font-weight:600;" id="cr-name">—</div>
              <div style="font-size:12px;color:var(--text2);margin-top:2px;" id="cr-desc">—</div>
            </div>
            <div class="flex-row" style="gap:8px;">
              <div class="stat-card" style="padding:10px 14px;"><div class="stat-label">Day</div><div style="font-family:var(--font-head);font-size:18px;font-weight:700;" id="cr-day">1</div></div>
              <div class="stat-card" style="padding:10px 14px;"><div class="stat-label">Portfolio</div><div style="font-family:var(--font-head);font-size:18px;font-weight:700;" id="cr-port">₹1,00,000</div></div>
              <div class="stat-card" style="padding:10px 14px;"><div class="stat-label">Change</div><div style="font-family:var(--font-head);font-size:18px;font-weight:700;" id="cr-change" style="color:var(--text)">0%</div></div>
            </div>
          </div>
          <div style="height:5px;background:var(--bg4);border-radius:3px;margin-bottom:12px;overflow:hidden;"><div style="height:100%;background:var(--accent);border-radius:3px;transition:width .3s;" id="cr-progress"></div></div>
          <div style="height:200px;margin-bottom:12px;"><canvas id="cr-chart"></canvas></div>
          <div class="event-flag" id="cr-event">Replay ready. Press Start to begin.</div>
        </div>
        <div class="replay-controls">
          <button class="btn btn-primary btn-sm" id="cr-start-btn" onclick="startCrashReplay()">Start Replay</button>
          <button class="btn btn-secondary btn-sm" id="cr-pause-btn" onclick="toggleCrashPause()" disabled>Pause</button>
          <button class="btn btn-secondary btn-sm" onclick="resetCrashReplay()">Reset</button>
          <span style="font-size:11px;color:var(--text3);">10x speed — each tick = 1 trading day</span>
        </div>
        <div id="cr-debrief-area"></div>
      </div>
    </div>`,

  debrief: () => `
    <div class="page active" id="page-debrief">
      <div class="page-title">Bias Report</div>
      <div class="page-sub">Your behavioral analysis across all simulation sessions.</div>
      <div class="grid-2 mb-20">
        <div class="card">
          <div class="sec-label">Your Fear Profile</div>
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:16px;">
            <div style="width:52px;height:52px;border-radius:50%;background:rgba(124,106,247,.15);border:2px solid var(--accent);display:flex;align-items:center;justify-content:center;font-size:22px;" id="debrief-profile-icon">🧠</div>
            <div>
              <div style="font-family:var(--font-head);font-size:16px;font-weight:700;color:var(--accent2);" id="debrief-profile-name">—</div>
              <div style="font-size:11px;color:var(--text2);margin-top:2px;" id="debrief-profile-sub">Complete fear assessment first</div>
            </div>
          </div>
          <div id="debrief-bias-bars"></div>
        </div>
        <div class="card">
          <div class="sec-label">Session Statistics</div>
          <div id="debrief-stats"><div style="font-size:12px;color:var(--text3);">No sessions completed yet.</div></div>
        </div>
      </div>
      <div class="card mb-16">
        <div class="sec-label">AI Behavioral Analysis <span class="badge badge-purple" style="margin-left:6px;">Gemini</span></div>
        <div class="debrief-text" id="debrief-ai-text">
          <p style="color:var(--text3);">Complete at least one simulation or crash replay, then generate your AI-powered behavioral analysis.</p>
        </div>
        <button class="btn btn-secondary btn-sm mt-12" onclick="generateAIDebrief()" id="debrief-generate-btn">Generate AI Analysis</button>
      </div>
      <div class="card">
        <div class="sec-label">Evidence-Based Tips For Your Profile</div>
        <div id="debrief-tips-list"><div style="font-size:12px;color:var(--text3);">Complete Fear Assessment to see personalized tips.</div></div>
      </div>
    </div>`,

  coach: () => `
    <div class="page active" id="page-coach">
      <div class="page-title">AI Coach <span class="badge badge-purple" style="font-size:11px;vertical-align:middle;margin-left:6px;">Gemini</span></div>
      <div class="page-sub">Ask anything about investing, markets, or your fear profile. Responds in Hindi, English, or Punjabi.</div>
      <div class="flex-row mb-16">
        <div class="sec-label" style="margin-bottom:0;">Language</div>
        <div class="chat-lang">
          <button class="lang-btn active" onclick="setLang('english',this)">English</button>
          <button class="lang-btn" onclick="setLang('hindi',this)">हिंदी</button>
          <button class="lang-btn" onclick="setLang('punjabi',this)">ਪੰਜਾਬੀ</button>
        </div>
      </div>
      <div class="chat-window">
        <div class="chat-messages" id="chat-messages">
          <div class="chat-msg ai">Namaste! I'm your InvestIQ AI Coach, powered by Gemini. I can explain market movements, help you understand your behavioral biases, or answer any investing question. What's on your mind?</div>
        </div>
        <div style="padding:0 16px 10px;display:flex;flex-wrap:wrap;gap:6px;" id="coach-suggestions">
          <button class="suggestion-chip" onclick="sendSuggestion(this)">Why did my portfolio drop?</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">What is loss aversion?</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">How does a SIP work?</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">Should I invest in Nifty 50?</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">मुझे निवेश से डर लगता है</button>
          <button class="suggestion-chip" onclick="sendSuggestion(this)">What is recency bias?</button>
        </div>
        <div class="chat-input-row">
          <input type="text" id="chat-input" placeholder="Ask your investing question..." onkeydown="if(event.key==='Enter')sendChatMessage()"/>
          <button class="btn btn-primary btn-sm" onclick="sendChatMessage()">Send</button>
        </div>
      </div>
    </div>`,

  fincheck: () => `
    <div class="page active" id="page-fincheck">
      <div class="page-title">Finfluencer Myth Buster <span class="badge badge-purple" style="font-size:11px;vertical-align:middle;margin-left:6px;">Gemini</span></div>
      <div class="page-sub">Paste any stock tip or investment claim from social media. Gemini AI analyzes it for manipulation, pump-and-dump signals, and SEBI violations.</div>
      <div class="card mb-16">
        <div class="sec-label">Paste the claim to analyze</div>
        <textarea id="fin-input" placeholder="e.g. 'This stock is going to 10x in 2 months! Everyone is buying it. Buy NOW before it's too late. I made ₹2L last week. DM me for my secret picks.'&#10;&#10;Paste any tip from WhatsApp, Telegram, Instagram, YouTube comments..." style="margin-bottom:12px;height:100px;"></textarea>
        <button class="btn btn-primary" onclick="analyzeFinfluencer()">Analyze with Gemini AI</button>
      </div>
      <div id="fin-result" style="display:none;">
        <div class="risk-indicator">
          <div style="flex:1;">
            <div style="font-size:11px;color:var(--text2);margin-bottom:4px;">AI Verdict</div>
            <div style="font-size:13px;color:var(--text);line-height:1.5;" id="fin-verdict">Analyzing...</div>
          </div>
          <div class="risk-badge" id="fin-risk-badge">RISK</div>
        </div>
        <div class="card mb-12">
          <div class="sec-label">Red Flags Detected</div>
          <ul class="flag-list" id="fin-flags"></ul>
        </div>
        <div class="card mb-12">
          <div class="sec-label">What to Do</div>
          <div style="font-size:13px;color:var(--text2);line-height:1.7;" id="fin-action"></div>
        </div>
        <div style="font-size:11px;color:var(--text3);text-align:center;padding:8px 0;">Verify SEBI registration at <strong style="color:var(--accent2);">sebi.gov.in/sebiweb/home</strong></div>
      </div>
      <div class="card" style="margin-top:16px;">
        <div class="sec-label">Common Red Flags to Watch For</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
          <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;font-weight:600;color:var(--red);margin-bottom:3px;">Guaranteed returns</div><div style="font-size:11px;color:var(--text2);">"100% guaranteed returns" — No investment guarantees returns. This is an illegal claim under SEBI.</div></div>
          <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;font-weight:600;color:var(--red);margin-bottom:3px;">Artificial urgency</div><div style="font-size:11px;color:var(--text2);">"Buy NOW before 3pm" — Urgency prevents rational thinking. Classic manipulation tactic.</div></div>
          <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;font-weight:600;color:var(--red);margin-bottom:3px;">Unregistered advice</div><div style="font-size:11px;color:var(--text2);">Only 2% of finfluencers are SEBI-registered, yet 33% give explicit stock recommendations.</div></div>
          <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;"><div style="font-size:11px;font-weight:600;color:var(--red);margin-bottom:3px;">Pump-and-dump signals</div><div style="font-size:11px;color:var(--text2);">91% of retail F&O traders lost money in FY25. Most followed social media tips.</div></div>
        </div>
      </div>
    </div>`,

  graduation: () => `
    <div class="page active" id="page-graduation">
      <div class="page-title">Graduation</div>
      <div class="page-sub">Complete all 3 milestones to earn your InvestIQ certificate and unlock your first SIP recommendation.</div>
      <div class="grid-2 mb-20">
        <div class="card">
          <div class="sec-label">Milestone Progress</div>
          <div id="grad-milestones"></div>
        </div>
        <div class="card">
          <div class="sec-label">What Graduation Unlocks</div>
          <div style="display:flex;flex-direction:column;gap:8px;">
            <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;font-size:12px;"><div style="font-weight:600;color:var(--green);margin-bottom:2px;">Personalized SIP recommendation</div><div style="color:var(--text2);">Specific fund, monthly amount, timeline based on your goal and bias profile.</div></div>
            <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;font-size:12px;"><div style="font-weight:600;color:var(--accent2);margin-bottom:2px;">InvestIQ Certificate</div><div style="color:var(--text2);">Shareable "I survived the crash" card for Instagram/LinkedIn.</div></div>
            <div style="background:var(--bg3);border-radius:8px;padding:10px 12px;font-size:12px;"><div style="font-weight:600;color:var(--amber);margin-bottom:2px;">Direct investment link</div><div style="color:var(--text2);">One-tap deep link to Groww or Zerodha to start your first real investment.</div></div>
          </div>
        </div>
      </div>
      <div id="grad-card-area"></div>
    </div>`
};

// ── NAVIGATION ──────────────────────────────────────────
function showPage(id, navItem) {
  document.querySelectorAll('.page').forEach(p => p.remove());
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  const template = PAGE_TEMPLATES[id];
  if (!template) return;
  document.getElementById('main-content').innerHTML = template();
  if (navItem) navItem.classList.add('active');

  // Page-specific init
  if (id === 'dashboard')  refreshDashboard();
  if (id === 'sandbox')    requestAnimationFrame(() => { initSandbox(); });
  if (id === 'crash')      requestAnimationFrame(() => { renderCrashSelector(); });
  if (id === 'debrief')    refreshDebrief();
  if (id === 'graduation') refreshGraduation();
}

function navToPage(id) {
  const items = document.querySelectorAll('.nav-item');
  let found = null;
  items.forEach(item => { if (item.getAttribute('onclick') && item.getAttribute('onclick').includes(`'${id}'`)) found = item; });
  showPage(id, found);
}

// ── DASHBOARD ───────────────────────────────────────────
function refreshDashboard() {
  const get = id => document.getElementById(id);
  if (!get('dash-portfolio')) return;

  if (STATE.fearProfile) {
    const profile = PROFILES[STATE.fearProfile];
    get('dash-greeting').textContent = `Keep going, ${profile.name}`;
    get('dash-profile-tag').textContent = profile.name;
    get('dash-bias-bars').innerHTML = renderBiasBars(STATE.biasScores);
    const biasMessages = {
      loss_aversion: 'You sold during a dip that recovered. Loss aversion cost you returns last session.',
      recency_bias: 'You reacted to recent news rather than long-term data. Recency bias detected.',
      herd_mentality: 'You followed the crowd at a critical moment. Work on independent decision-making.',
      overconfidence: 'You made aggressive moves. Overconfidence can lead to concentrated losses.',
      anchoring: 'You anchored to your purchase price. The market doesn\'t care what you paid.',
      balanced: 'Your behavioral profile looks healthy. Keep completing simulations to maintain your discipline.'
    };
    get('dash-bias-text').textContent = biasMessages[STATE.fearProfile] || biasMessages.balanced;
  }

  const pct = ((STATE.sandboxPortfolio - 100000) / 100000 * 100).toFixed(1);
  get('dash-portfolio').textContent = formatINR(STATE.sandboxPortfolio);
  get('dash-portfolio').className = 'stat-value ' + (STATE.sandboxPortfolio >= 100000 ? 'green' : 'red');
  get('dash-pnl').textContent = (pct >= 0 ? '+' : '') + pct + '% from start';
  get('dash-sims').textContent = STATE.simulationsDone;
  get('dash-crashes').textContent = STATE.crashesSurvived;

  const milestonesDone = Object.values(STATE.milestones).filter(Boolean).length;
  const gradPct = Math.round(milestonesDone / 3 * 100);
  get('dash-grad-pct').textContent = gradPct + '%';
  get('dash-grad-text').textContent = milestonesDone + ' of 3 milestones';

  // Discipline ring
  const ds = STATE.disciplineScore;
  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (ds / 100) * circumference;
  const circle = get('discipline-circle');
  if (circle) circle.style.strokeDashoffset = offset;
  const scoreEl = get('discipline-score-val');
  if (scoreEl) scoreEl.textContent = ds;

  // Badges
  const badgesEl = get('dash-badges');
  if (badgesEl) {
    badgesEl.innerHTML = '';
    if (STATE.crashesSurvived > 0) badgesEl.innerHTML += `<span class="badge badge-green">Crash Survivor</span>`;
    if (STATE.simulationsDone > 0) badgesEl.innerHTML += `<span class="badge badge-purple">Simulator</span>`;
    if (STATE.milestones.held_20pct_drop) badgesEl.innerHTML += `<span class="badge badge-amber">Iron Hands</span>`;
    if (Object.values(STATE.milestones).every(Boolean)) badgesEl.innerHTML += `<span class="badge badge-green">Graduated 🎓</span>`;
  }

  renderMilestoneList();
}

function renderMilestoneList() {
  const list = [
    { key: 'held_20pct_drop', label: 'Hold through −20% drop', sub: 'Stay invested when sandbox drops 20%', done: STATE.milestones.held_20pct_drop },
    { key: 'survived_crash', label: 'Survive a crash replay', sub: 'Complete any historical crash without panic-selling at the bottom', done: STATE.milestones.survived_crash },
    { key: 'completed_two_sims', label: 'Complete 2 simulations', sub: 'Run the sandbox simulation at least twice', done: STATE.milestones.completed_two_sims }
  ];
  const el = document.getElementById('milestone-list');
  if (!el) return;
  el.innerHTML = list.map(m => `
    <div class="milestone-item">
      <div class="milestone-dot" style="background:${m.done ? 'var(--green-bg)' : 'var(--bg3)'};border:1px solid ${m.done ? 'rgba(34,217,138,.3)' : 'var(--border)'};">
        <span style="color:${m.done ? 'var(--green)' : 'var(--text3)'};">${m.done ? '✓' : '○'}</span>
      </div>
      <div style="flex:1;">
        <div style="font-size:13px;font-weight:500;color:${m.done ? 'var(--green)' : 'var(--text)'};">${m.label}</div>
        <div style="font-size:11px;color:var(--text2);margin-top:1px;">${m.sub}</div>
      </div>
      <span class="badge ${m.done ? 'badge-green' : 'badge-amber'}">${m.done ? 'Done' : 'Pending'}</span>
    </div>`).join('');
}

// ── DEBRIEF ─────────────────────────────────────────────
function refreshDebrief() {
  const get = id => document.getElementById(id);
  if (!get('debrief-bias-bars')) return;
  if (STATE.fearProfile) {
    const profile = PROFILES[STATE.fearProfile];
    get('debrief-profile-icon').textContent = profile.icon;
    get('debrief-profile-name').textContent = profile.name;
    get('debrief-profile-sub').textContent = profile.desc.substring(0, 85) + '...';
    get('debrief-bias-bars').innerHTML = renderBiasBars(STATE.biasScores);
    const tips = BIAS_TIPS[STATE.fearProfile] || BIAS_TIPS.balanced;
    get('debrief-tips-list').innerHTML = tips.map(t =>
      `<div style="background:var(--bg3);border-radius:8px;padding:10px 12px;margin-bottom:8px;">
        <div style="font-size:12px;font-weight:500;color:var(--accent2);margin-bottom:3px;">${t.title}</div>
        <div style="font-size:12px;color:var(--text2);line-height:1.65;">${t.text}</div>
      </div>`).join('');
  }
  get('debrief-stats').innerHTML = `
    <div class="info-row"><span class="info-key">Simulations completed</span><span class="info-val">${STATE.simulationsDone}</span></div>
    <div class="info-row"><span class="info-key">Crashes survived</span><span class="info-val">${STATE.crashesSurvived}</span></div>
    <div class="info-row"><span class="info-key">Discipline score</span><span class="info-val" style="color:var(--accent2);">${STATE.disciplineScore}/100</span></div>
    <div class="info-row"><span class="info-key">Decisions logged</span><span class="info-val">${STATE.userDecisions.length + STATE.crashDecisions.length}</span></div>
    <div class="info-row"><span class="info-key">Milestones unlocked</span><span class="info-val">${Object.values(STATE.milestones).filter(Boolean).length}/3</span></div>`;
}

async function generateAIDebrief() {
  const btn = document.getElementById('debrief-generate-btn');
  const el = document.getElementById('debrief-ai-text');
  if (STATE.simulationsDone === 0 && STATE.crashesSurvived === 0) {
    el.innerHTML = '<p style="color:var(--amber);">Complete at least one simulation or crash replay first. Gemini needs your decision data to write a meaningful debrief.</p>';
    return;
  }
  btn.disabled = true;
  btn.textContent = 'Generating with Gemini...';
  el.innerHTML = '<p style="color:var(--text3);font-style:italic;">Gemini AI is writing your personalized behavioral analysis...</p>';
  try {
    const text = await generateDebrief({
      profile: STATE.fearProfile ? PROFILES[STATE.fearProfile].name : 'Unknown',
      biasScores: STATE.biasScores,
      decisions: [...STATE.userDecisions, ...STATE.crashDecisions].slice(-6),
      disciplineScore: STATE.disciplineScore,
      crashesSurvived: STATE.crashesSurvived,
      simulationsDone: STATE.simulationsDone
    });
    el.innerHTML = text.split('\n\n').filter(Boolean).map(p => `<p>${p}</p>`).join('');
  } catch (e) {
    el.innerHTML = `<p style="color:var(--red);">Gemini error: ${e.message}. Please try again.</p>`;
  }
  btn.disabled = false;
  btn.textContent = 'Regenerate Analysis';
}

// ── GRADUATION ──────────────────────────────────────────
function refreshGraduation() {
  const milestones = [
    { label: 'Held through −20% drop', icon: '💪', done: STATE.milestones.held_20pct_drop },
    { label: 'Survived a crash replay', icon: '🔥', done: STATE.milestones.survived_crash },
    { label: 'Completed 2+ simulations', icon: '📈', done: STATE.milestones.completed_two_sims }
  ];
  const gmEl = document.getElementById('grad-milestones');
  if (gmEl) {
    gmEl.innerHTML = milestones.map(m => `
      <div class="milestone-item">
        <div class="milestone-dot" style="background:${m.done ? 'var(--green-bg)' : 'var(--bg3)'};border:1px solid ${m.done ? 'rgba(34,217,138,.3)' : 'var(--border)'};font-size:16px;">
          ${m.done ? '<span style="color:var(--green);">✓</span>' : m.icon}
        </div>
        <div style="flex:1;font-size:13px;font-weight:500;color:${m.done ? 'var(--green)' : 'var(--text)'};">${m.label}</div>
        <span class="badge ${m.done ? 'badge-green' : 'badge-amber'}">${m.done ? 'Unlocked' : 'Locked'}</span>
      </div>`).join('');
  }
  const allDone = Object.values(STATE.milestones).every(Boolean);
  const area = document.getElementById('grad-card-area');
  if (!area) return;

  if (allDone) {
    area.innerHTML = `
      <div class="grad-card" id="the-grad-card">
        <div class="grad-badge">InvestIQ Certified</div>
        <div class="grad-title">I Survived the Market 🎓</div>
        <div class="grad-sub">Held through real crashes. Recognized my biases. Earned the right to invest with discipline.</div>
        <div class="grad-stats">
          <div class="gs-item"><div class="gs-val">${STATE.disciplineScore}</div><div class="gs-lbl">Discipline</div></div>
          <div class="gs-item"><div class="gs-val">${STATE.crashesSurvived}</div><div class="gs-lbl">Crashes</div></div>
          <div class="gs-item"><div class="gs-val">${STATE.simulationsDone}</div><div class="gs-lbl">Simulations</div></div>
          <div class="gs-item"><div class="gs-val">${Object.values(STATE.milestones).filter(Boolean).length}/3</div><div class="gs-lbl">Milestones</div></div>
        </div>
        <div class="grad-sip">
          <div class="sip-title">Your First SIP Recommendation</div>
          <div class="sip-detail">Start with <strong>₹500/month</strong> in <strong>Nifty 50 Index Fund (Direct Plan)</strong>. Increase by ₹100 every 6 months. Target horizon: 7 years. Expected corpus at 12% CAGR: ~₹74,000.</div>
        </div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="window.open('https://groww.in','_blank')">Start Investing on Groww →</button>
          <button class="btn btn-secondary" onclick="downloadCertificate()">Download Certificate</button>
        </div>
      </div>`;
  } else {
    const done = Object.values(STATE.milestones).filter(Boolean).length;
    area.innerHTML = `
      <div class="card" style="text-align:center;padding:36px;">
        <div style="font-size:40px;margin-bottom:14px;">🔒</div>
        <div style="font-family:var(--font-head);font-size:18px;font-weight:700;margin-bottom:8px;">Graduation Locked</div>
        <div style="font-size:13px;color:var(--text2);margin-bottom:20px;">${done}/3 milestones completed. Complete all 3 to unlock your certificate and SIP recommendation.</div>
        <div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <button class="btn btn-primary" onclick="navToPage('sandbox')">Go to Sandbox →</button>
          <button class="btn btn-secondary" onclick="navToPage('crash')">Crash Replay →</button>
        </div>
      </div>`;
  }
}

function downloadCertificate() {
  const text = [
    '╔══════════════════════════════════════╗',
    '║       INVESTIQ CERTIFICATE           ║',
    '╚══════════════════════════════════════╝',
    '',
    '  I Survived the Market',
    '',
    `  Discipline Score:    ${STATE.disciplineScore}/100`,
    `  Crashes Survived:    ${STATE.crashesSurvived}`,
    `  Simulations Done:    ${STATE.simulationsDone}`,
    `  Milestones:          ${Object.values(STATE.milestones).filter(Boolean).length}/3`,
    '',
    '  First SIP Recommendation:',
    '  ₹500/month — Nifty 50 Index Fund',
    '  Direct Plan — 7 year horizon',
    '',
    '  InvestIQ — Practice Before You Pay',
    '  investiq.app',
    '',
    `  Issued: ${new Date().toLocaleDateString('en-IN')}`
  ].join('\n');

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'InvestIQ_Certificate.txt';
  a.click(); URL.revokeObjectURL(url);
  showToast('Certificate downloaded!', 'success');
}

// ── BOOT ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  // Render default dashboard page
  document.getElementById('main-content').innerHTML = PAGE_TEMPLATES.dashboard();
  refreshDashboard();
});
