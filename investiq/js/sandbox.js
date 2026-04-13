// js/sandbox.js — Live sandbox simulation

let sbChart = null;
let sbInterval = null;
let sbSeconds = 0;
let stockPrices = {};

// Initialise prices from data
STOCKS.forEach(s => { stockPrices[s.id] = s.price; });

function initSandbox() {
  renderPriceGrid();
  initSBChart();
  updateSBStats();
}

function initSBChart() {
  const ctx = document.getElementById('sb-chart');
  if (!ctx) return;
  if (sbChart) { sbChart.destroy(); sbChart = null; }
  const cfg = buildChartDefaults(['Start'], [{
    label: 'Portfolio Value',
    data: [100000],
    borderColor: '#7c6af7',
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.4,
    fill: true,
    backgroundColor: 'rgba(124,106,247,0.06)'
  }]);
  sbChart = new Chart(ctx, cfg);
}

function renderPriceGrid() {
  const grid = document.getElementById('price-grid');
  if (!grid) return;
  grid.innerHTML = STOCKS.map(s => {
    const price = stockPrices[s.id];
    const pctChange = ((price - s.price) / s.price * 100).toFixed(2);
    const isPos = pctChange >= 0;
    const held = STATE.sandboxHoldings[s.id] ? STATE.sandboxHoldings[s.id].qty : 0;
    return `<div class="price-card ${STATE.selectedStock === s.id ? 'selected' : ''} ${held > 0 ? 'owned' : ''}" onclick="selectStock('${s.id}')">
      ${held > 0 ? `<span class="pc-badge badge-green">${held}</span>` : ''}
      <div class="pc-name">${s.symbol}</div>
      <div class="pc-sub">${s.name}</div>
      <div class="pc-price" style="color:${isPos ? 'var(--green)' : 'var(--red)'}">₹${price.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</div>
      <div class="pc-change" style="color:${isPos ? 'var(--green)' : 'var(--red)'}">${isPos ? '+' : ''}${pctChange}%</div>
    </div>`;
  }).join('');
}

function toggleSandbox() {
  const btn = document.getElementById('sb-toggle-btn');
  if (!STATE.sandboxRunning) {
    STATE.sandboxRunning = true;
    btn.textContent = 'Stop Simulation';
    btn.className = 'btn btn-sm btn-danger';
    sbInterval = setInterval(sandboxTick, 1800);
  } else {
    STATE.sandboxRunning = false;
    clearInterval(sbInterval);
    btn.textContent = 'Start Simulation';
    btn.className = 'btn btn-sm btn-primary';
    STATE.simulationsDone++;
    document.getElementById('sb-timer-label').textContent = 'Simulation stopped — Day ' + sbSeconds;
    if (STATE.simulationsDone >= 2) STATE.milestones.completed_two_sims = true;
    showToast('Simulation complete! Check your Bias Report.', 'success');
  }
}

function sandboxTick() {
  sbSeconds++;
  document.getElementById('sb-timer-label').textContent = 'Day ' + sbSeconds + ' — Live simulation';

  STOCKS.forEach(s => {
    const drift = (Math.random() - 0.49) * 0.016;
    stockPrices[s.id] = Math.max(stockPrices[s.id] * (1 + drift), 5);
  });

  recalcPortfolio();
  renderPriceGrid();

  if (sbChart) {
    sbChart.data.labels.push('D' + sbSeconds);
    sbChart.data.datasets[0].data.push(Math.round(STATE.sandboxPortfolio));
    if (sbChart.data.labels.length > 60) {
      sbChart.data.labels.shift();
      sbChart.data.datasets[0].data.shift();
    }
    sbChart.update('none');
  }

  // Emotional checkpoints
  const drop = (100000 - STATE.sandboxPortfolio) / 100000 * 100;
  if (drop >= 10 && !STATE.checkpointsShown[10]) { STATE.checkpointsShown[10] = true; showSandboxCheckpoint(10); }
  else if (drop >= 20 && !STATE.checkpointsShown[20]) { STATE.checkpointsShown[20] = true; showSandboxCheckpoint(20); STATE.milestones.held_20pct_drop = true; }
  else if (drop >= 30 && !STATE.checkpointsShown[30]) { STATE.checkpointsShown[30] = true; showSandboxCheckpoint(30); }

  updateSBStats();
  updateHoldingsPanel();
}

function recalcPortfolio() {
  let holdingsValue = 0;
  Object.entries(STATE.sandboxHoldings).forEach(([id, h]) => {
    holdingsValue += stockPrices[id] * h.qty;
  });
  STATE.sandboxPortfolio = STATE.sandboxCash + holdingsValue;
}

function updateSBStats() {
  const el = (id) => document.getElementById(id);
  if (!el('sb-port-val')) return;
  const pct = ((STATE.sandboxPortfolio - 100000) / 100000 * 100).toFixed(1);
  el('sb-port-val').textContent = formatINR(STATE.sandboxPortfolio);
  el('sb-port-val').className = 'stat-value ' + (STATE.sandboxPortfolio >= 100000 ? 'green' : 'red');
  el('sb-return').textContent = (pct >= 0 ? '+' : '') + pct + '%';
  el('sb-return').className = 'stat-value ' + (pct >= 0 ? 'green' : 'red');
  el('sb-cash').textContent = formatINR(STATE.sandboxCash);
  el('sb-discipline').textContent = STATE.disciplineScore;
}

function selectStock(id) {
  STATE.selectedStock = id;
  renderPriceGrid();
  const stock = STOCKS.find(s => s.id === id);
  const panel = document.getElementById('trade-panel');
  panel.style.display = 'block';
  document.getElementById('trade-stock-name').textContent = stock.name + ' (' + stock.symbol + ')';
  document.getElementById('trade-price').textContent = '₹' + stockPrices[id].toFixed(2);
  updateTradeTotal();
}

function updateTradeTotal() {
  if (!STATE.selectedStock) return;
  const qty = parseInt(document.getElementById('trade-qty').value) || 1;
  const price = stockPrices[STATE.selectedStock];
  document.getElementById('trade-total').textContent = formatINR(qty * price);
}

function executeTrade(type) {
  if (!STATE.selectedStock) return;
  const stock = STOCKS.find(s => s.id === STATE.selectedStock);
  const qty = parseInt(document.getElementById('trade-qty').value) || 1;
  const price = stockPrices[STATE.selectedStock];
  const total = qty * price;

  if (type === 'buy') {
    if (STATE.sandboxCash < total) { showToast('Insufficient cash!', 'error'); return; }
    showLossProbModal(STATE.selectedStock);
    STATE.sandboxCash -= total;
    if (!STATE.sandboxHoldings[STATE.selectedStock]) {
      STATE.sandboxHoldings[STATE.selectedStock] = { qty: 0, avgPrice: price, stock };
    }
    STATE.sandboxHoldings[STATE.selectedStock].qty += qty;
    showToast(`Bought ${qty} × ${stock.symbol} @ ₹${price.toFixed(0)}`, 'success');
  } else {
    const held = STATE.sandboxHoldings[STATE.selectedStock];
    if (!held || held.qty < qty) { showToast('Not enough shares held.', 'error'); return; }
    STATE.sandboxCash += total;
    held.qty -= qty;
    if (held.qty === 0) delete STATE.sandboxHoldings[STATE.selectedStock];
    const drop = (100000 - STATE.sandboxPortfolio) / 100000 * 100;
    if (drop > 10) {
      STATE.disciplineScore = Math.max(0, STATE.disciplineScore - 8);
      STATE.userDecisions.push({ type: 'sell_dip', drop: drop.toFixed(0), portVal: Math.round(STATE.sandboxPortfolio) });
      showToast('Sold during a dip — discipline −8', 'warn');
    } else {
      showToast(`Sold ${qty} × ${stock.symbol} @ ₹${price.toFixed(0)}`, 'info');
    }
  }
  recalcPortfolio();
  updateSBStats();
  renderPriceGrid();
  updateHoldingsPanel();
}

function closeTrade() {
  document.getElementById('trade-panel').style.display = 'none';
  STATE.selectedStock = null;
  renderPriceGrid();
}

function updateHoldingsPanel() {
  const panel = document.getElementById('holdings-panel');
  if (!panel) return;
  const entries = Object.entries(STATE.sandboxHoldings);
  if (!entries.length) {
    panel.innerHTML = '<div style="font-size:12px;color:var(--text3);">No positions yet. Buy stocks to start building your portfolio.</div>';
    return;
  }
  panel.innerHTML = entries.map(([id, h]) => {
    const cur = stockPrices[id];
    const curVal = cur * h.qty;
    const pnl = curVal - h.avgPrice * h.qty;
    const pnlPct = (pnl / (h.avgPrice * h.qty) * 100).toFixed(1);
    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);">
      <div>
        <div style="font-size:13px;font-weight:500;">${h.stock.symbol}</div>
        <div style="font-size:11px;color:var(--text2);">${h.qty} shares @ avg ₹${h.avgPrice.toFixed(0)}</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:13px;font-weight:600;">${formatINR(curVal)}</div>
        <div style="font-size:11px;color:${pnl >= 0 ? 'var(--green)' : 'var(--red)'};">${pnl >= 0 ? '+' : ''}${formatINR(pnl)} (${pnlPct}%)</div>
      </div>
    </div>`;
  }).join('');
}

function showSandboxCheckpoint(dropPct) {
  clearInterval(sbInterval);
  _sbCheckpointDrop = dropPct;
  document.getElementById('cp-drop-pct').textContent = '−' + dropPct + '%';
  document.getElementById('cp-value-text').textContent = 'Your ₹1,00,000 is now ' + formatINR(STATE.sandboxPortfolio);
  document.getElementById('cp-context').textContent = CP_CONTEXTS[dropPct];
  document.getElementById('cp-peer-stat').textContent = PEER_STATS[dropPct];
  buildCheckpointChoices('handleSandboxCheckpointDecision');
  document.getElementById('checkpoint-modal').classList.add('show');
}

let _sbCheckpointDrop = 0;

function handleSandboxCheckpointDecision(type) {
  const dropPct = _sbCheckpointDrop;
  const isPanic = type === 'panic_sell' || type === 'sell_half';
  STATE.userDecisions.push({ type, dropPct, portVal: Math.round(STATE.sandboxPortfolio) });
  if (isPanic) {
    STATE.disciplineScore = Math.max(0, STATE.disciplineScore - 15);
    showToast('Logged: emotional sell — discipline −15', 'warn');
  } else {
    STATE.disciplineScore = Math.min(100, STATE.disciplineScore + 5);
    showToast('Logged: held through dip — discipline +5', 'success');
  }
  document.getElementById('checkpoint-modal').classList.remove('show');
  if (STATE.sandboxRunning) sbInterval = setInterval(sandboxTick, 1800);
}

function buildCheckpointChoices(callbackName) {
  const choices = [
    { text: 'Sell everything — protect what\'s left', type: 'panic_sell' },
    { text: 'Sell half — reduce exposure', type: 'sell_half' },
    { text: 'Hold — this will recover', type: 'hold' },
    { text: 'Buy more — this is a discount', type: 'buy_more' }
  ];
  document.getElementById('cp-choices').innerHTML = choices.map(c =>
    `<button class="cp-choice" onclick="${callbackName}('${c.type}')">${c.text}</button>`
  ).join('');
}

function resetSandbox() {
  clearInterval(sbInterval);
  STATE.sandboxRunning = false;
  STATE.sandboxPortfolio = 100000;
  STATE.sandboxCash = 100000;
  STATE.sandboxHoldings = {};
  STATE.checkpointsShown = { 10: false, 20: false, 30: false };
  STATE.selectedStock = null;
  STOCKS.forEach(s => { stockPrices[s.id] = s.price; });
  sbSeconds = 0;
  const btn = document.getElementById('sb-toggle-btn');
  if (btn) { btn.textContent = 'Start Simulation'; btn.className = 'btn btn-sm btn-primary'; }
  const label = document.getElementById('sb-timer-label');
  if (label) label.textContent = 'Simulation not started';
  const tp = document.getElementById('trade-panel');
  if (tp) tp.style.display = 'none';
  updateSBStats();
  renderPriceGrid();
  updateHoldingsPanel();
  initSBChart();
  showToast('Sandbox reset.', 'info');
}
