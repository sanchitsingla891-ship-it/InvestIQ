// js/utils.js — Shared utility functions

function showToast(msg, type = 'info') {
  const colors = { info: '#7c6af7', success: '#22d98a', warn: '#ffb547', error: '#ff5c6a' };
  const t = document.createElement('div');
  t.className = 'toast';
  t.style.border = `1px solid ${colors[type] || colors.info}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function formatINR(amount) {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function formatPct(value, base = 100000) {
  const pct = ((value - base) / base * 100).toFixed(1);
  return (pct >= 0 ? '+' : '') + pct + '%';
}

function renderBiasBars(scores) {
  const labels = {
    loss_aversion: 'Loss Aversion',
    recency_bias: 'Recency Bias',
    herd_mentality: 'Herd Mentality',
    overconfidence: 'Overconfidence',
    anchoring: 'Anchoring'
  };
  return Object.entries(scores).map(([k, v]) => {
    const color = v >= 60 ? 'pf-red' : v >= 30 ? 'pf-amber' : 'pf-green';
    const textColor = v >= 60 ? 'var(--red)' : v >= 30 ? 'var(--amber)' : 'var(--green)';
    const level = v >= 60 ? 'High' : v >= 30 ? 'Medium' : 'Low';
    return `<div class="progress-wrap">
      <div class="progress-label">
        <span>${labels[k]}</span>
        <span style="color:${textColor};font-weight:500;">${level}</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${color}" style="width:${Math.max(v, 2)}%"></div>
      </div>
    </div>`;
  }).join('');
}

function getDominantBias(biasScores) {
  let maxBias = 'balanced', maxScore = 20;
  Object.entries(biasScores).forEach(([k, v]) => {
    if (v > maxScore) { maxScore = v; maxBias = k; }
  });
  return maxBias;
}

function closeProbModal() {
  document.getElementById('prob-modal').classList.remove('show');
}

function showLossProbModal(stockId) {
  const stock = STOCKS.find(s => s.id === stockId);
  document.getElementById('prob-stock-name').textContent =
    (stock ? stock.name : 'This investment') + ' — historical loss probability';
  const isIndex = stockId === 'nifty';
  const probData = isIndex
    ? [{ h: '1 year', p: 28 }, { h: '3 years', p: 16 }, { h: '5 years', p: 8 }, { h: '10 years', p: 3 }]
    : [{ h: '1 year', p: 36 }, { h: '3 years', p: 21 }, { h: '5 years', p: 11 }, { h: '10 years', p: 5 }];
  document.getElementById('prob-bars').innerHTML = probData.map(d => `
    <div class="progress-wrap">
      <div class="progress-label">
        <span>Probability of loss at ${d.h}</span>
        <span style="color:${d.p > 20 ? 'var(--red)' : d.p > 10 ? 'var(--amber)' : 'var(--green)'};font-weight:600;">${d.p}%</span>
      </div>
      <div class="progress-track">
        <div class="progress-fill ${d.p > 20 ? 'pf-red' : d.p > 10 ? 'pf-amber' : 'pf-green'}" style="width:${d.p}%"></div>
      </div>
    </div>`).join('');
  document.getElementById('prob-modal').classList.add('show');
}

function buildChartDefaults(labels, datasets) {
  return {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 0 },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: datasets.length > 1,
          labels: { color: '#9896b0', font: { size: 10 }, boxWidth: 10 }
        },
        tooltip: { callbacks: { label: c => formatINR(c.raw) } }
      },
      scales: {
        x: { display: false },
        y: {
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: { color: '#5a5870', font: { size: 10 }, callback: v => '₹' + (v / 1000).toFixed(0) + 'k' }
        }
      }
    }
  };
}
