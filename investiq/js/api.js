// js/api.js — Connects frontend to our local InvestoCoach Node.js Backend

const API_BASE_URL = 'http://localhost:5000';
let AUTH_TOKEN = localStorage.getItem('investiq_token') || null;
let WS_CONNECTION = null;

// Generic fetch wrapper to inject JWT token
const apiCall = async (method, endpoint, body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (AUTH_TOKEN) headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;

  try {
    const opts = { method, headers };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${API_BASE_URL}${endpoint}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'API request failed');
    return data;
  } catch (err) {
    console.error(`[API] ${method} ${endpoint} failed:`, err.message);
    throw err;
  }
};

// ── AUTHENTICATION (Guest Flow) ───────────────────────────────────────────────
// We silently create a guest account to use the backend without breaking the demo UX.
const initGuestAuth = async () => {
  if (AUTH_TOKEN) return true; // Already signed in

  const guestId = Math.random().toString(36).substring(2, 9);
  const email = `guest_${guestId}@investiq.app`;
  const password = `guest_pass_${guestId}`;

  try {
    const data = await apiCall('POST', '/auth/signup', {
      name: 'Guest Investor',
      email,
      password,
      riskPreference: 'low'
    });
    
    AUTH_TOKEN = data.token;
    localStorage.setItem('investiq_token', AUTH_TOKEN);
    console.log('[API] Guest authenticated successfully:', data.user.id);
    return true;
  } catch (err) {
    console.error('Guest auth failed', err);
    return false;
  }
};

// ── API ENDPOINTS EXPOSED TO FRONTEND ─────────────────────────────────────────

const API = {
  // Sync boarding fear profile
  updateProfile: (profileData) => apiCall('PATCH', '/user/profile', profileData),
  
  // Market & Portfolio
  getTrendingMarkets: () => apiCall('GET', '/market/trending'),
  getPortfolio: () => apiCall('GET', '/portfolio'),
  buyAsset: (symbol, quantity) => apiCall('POST', '/portfolio/buy', { symbol, quantity }),
  sellAsset: (symbol, quantity) => apiCall('POST', '/portfolio/sell', { symbol, quantity }),

  // Simulation & Behaviors
  logDecision: (logParams) => apiCall('POST', '/behavior/log', logParams), // { sessionId, decisionType, symbol, priceAtDecision ... }
  getProgress: () => apiCall('GET', '/progress'),
  
  // Recommendations / AI (Gemini Proxies)
  generateFearQuestion: (biasTarget, previousQuestions) => apiCall('POST', '/recommendations/fear-question', { biasTarget, previousQuestions }),
  generateDebrief: (sessionData) => apiCall('POST', '/recommendations/debrief', sessionData),
  coachChat: (userMessage, context) => apiCall('POST', '/recommendations/coach-chat', { userMessage, context }),
  analyzeClaim: (claimText) => apiCall('POST', '/recommendations/analyze-claim', { claimText }),

  // Websocket for live prices
  onLivePrices: (callback) => {
    if (WS_CONNECTION) return;
    const wsUrl = API_BASE_URL.replace('http', 'ws');
    WS_CONNECTION = new WebSocket(wsUrl);
    
    WS_CONNECTION.onopen = () => console.log('[WG] Live prices connected');
    WS_CONNECTION.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'price_update') callback(data.prices);
      } catch (e) {}
    };
    WS_CONNECTION.onerror = (err) => console.error('[WS] Error', err);
  }
};
