// js/coach.js — AI Coach chat (Gemini powered)

function setLang(lang, btn) {
  STATE.lang = lang;
  document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function sendSuggestion(chip) {
  document.getElementById('chat-input').value = chip.textContent;
  sendChatMessage();
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';

  addChatMsg(msg, 'user');
  const loadingEl = addChatMsg('Thinking...', 'ai loading');

  try {
    const response = await coachChat(msg, {
      profile: STATE.fearProfile ? PROFILES[STATE.fearProfile].name : 'Unknown',
      disciplineScore: STATE.disciplineScore
    });
    loadingEl.textContent = response;
    loadingEl.classList.remove('loading');
  } catch (e) {
    // Fallback to demo responses
    await new Promise(r => setTimeout(r, 600));
    const langResponses = DEMO_RESPONSES[STATE.lang] || DEMO_RESPONSES.english;
    const msgLower = msg.toLowerCase();
    let reply = langResponses.default;
    Object.entries(DEMO_RESPONSES.english).forEach(([key, val]) => {
      if (key !== 'default' && msgLower.includes(key.split(' ')[0])) reply = val;
    });
    loadingEl.textContent = reply;
    loadingEl.classList.remove('loading');
  }

  const msgs = document.getElementById('chat-messages');
  msgs.scrollTop = msgs.scrollHeight;
}

function addChatMsg(text, type) {
  const msgs = document.getElementById('chat-messages');
  const el = document.createElement('div');
  el.className = 'chat-msg ' + type;
  el.textContent = text;
  msgs.appendChild(el);
  msgs.scrollTop = msgs.scrollHeight;
  return el;
}
