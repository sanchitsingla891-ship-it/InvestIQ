// js/onboarding.js — Fear Assessment flow

let obCurrentQ = 0;

function nextObStep(step) {
  document.querySelectorAll('.ob-step').forEach(s => s.classList.remove('active'));
  document.getElementById('ob-' + step).classList.add('active');
  if (step === 1) renderOBQuestion(0);
}

function renderOBQuestion(idx) {
  const q = QUESTIONS[idx];
  document.getElementById('ob-question').textContent = q.q;
  document.getElementById('ob-qcount').textContent = `Question ${idx + 1} of ${QUESTIONS.length}`;
  document.getElementById('ob-prog').style.width = `${((idx + 1) / QUESTIONS.length) * 100}%`;

  const choicesEl = document.getElementById('ob-choices');
  choicesEl.innerHTML = '';
  q.choices.forEach((c, i) => {
    const btn = document.createElement('button');
    btn.className = 'ob-choice';
    btn.textContent = c.text;
    btn.onclick = () => selectOBChoice(idx, i, c);
    choicesEl.appendChild(btn);
  });
}

function selectOBChoice(qIdx, cIdx, choice) {
  document.querySelectorAll('.ob-choice').forEach(b => b.classList.remove('selected'));
  document.querySelectorAll('.ob-choice')[cIdx].classList.add('selected');

  if (choice.bias && choice.weight) {
    STATE.biasScores[choice.bias] = Math.min(100, STATE.biasScores[choice.bias] + choice.weight);
  }

  setTimeout(() => {
    obCurrentQ++;
    if (obCurrentQ < QUESTIONS.length) {
      renderOBQuestion(obCurrentQ);
    } else {
      showOBResult();
    }
  }, 320);
}

function showOBResult() {
  const dominantBias = getDominantBias(STATE.biasScores);
  STATE.fearProfile = dominantBias;
  const profile = PROFILES[dominantBias];

  document.getElementById('profile-icon').textContent = profile.icon;
  document.getElementById('profile-name').textContent = profile.name;
  document.getElementById('profile-desc').textContent = profile.desc;
  document.getElementById('bias-bars-ob').innerHTML = renderBiasBars(STATE.biasScores);

  document.querySelectorAll('.ob-step').forEach(s => s.classList.remove('active'));
  document.getElementById('ob-result').classList.add('active');
}

function finishOnboarding() {
  document.getElementById('onboarding').style.display = 'none';
  refreshDashboard();
}
