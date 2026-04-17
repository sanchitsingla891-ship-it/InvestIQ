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
      profile: (STATE.fearProfile && PROFILES[STATE.fearProfile]) ? PROFILES[STATE.fearProfile].name : 'Unknown',
      disciplineScore: STATE.disciplineScore
    });
    loadingEl.textContent = response;
    loadingEl.classList.remove('loading');
    
    // Check for Knowledge Book recommendations
    const responseLower = response.toLowerCase();
    const userMsgLower = msg.toLowerCase();
    const recommendation = VARSITY_MODULES.find(m => 
      responseLower.includes(m.id) || 
      userMsgLower.includes(m.id) || 
      (m.id === 'intro' && (userMsgLower.includes('how to start') || userMsgLower.includes('new to market'))) ||
      (m.id === 'innerworth' && (userMsgLower.includes('scared') || userMsgLower.includes('panic') || userMsgLower.includes('fear')))
    );

    if (recommendation) {
      const recEl = document.createElement('div');
      recEl.className = 'chat-rec-link';
      recEl.innerHTML = `
        <div style="font-size:10px;color:var(--text3);margin-bottom:4px;text-transform:uppercase;">Recommended Reading</div>
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">${recommendation.icon}</span>
          <div style="flex:1;">
            <div style="font-size:12px;font-weight:600;">${recommendation.title}</div>
            <div style="font-size:10px;color:var(--text2);">Zerodha Varsity Module</div>
          </div>
          <button class="btn btn-primary btn-sm" style="padding:4px 8px;font-size:10px;" onclick="window.open('${recommendation.link}','_blank')">Read</button>
        </div>
      `;
      const msgs = document.getElementById('chat-messages');
      msgs.appendChild(recEl);
    }
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
