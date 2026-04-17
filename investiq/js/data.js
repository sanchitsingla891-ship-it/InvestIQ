// js/data.js — All static data for InvestIQ

// ── FEAR PROFILES ──────────────────────────────────────
const PROFILES = {
  loss_aversion: {
    name: 'Loss Avoider',
    icon: '😰',
    desc: 'You feel losses 2x more intensely than equivalent gains. This is the most common investing barrier in India — but it\'s trainable. Markets reward those who can sit with temporary discomfort.'
  },
  recency_bias: {
    name: 'Recency Reactor',
    icon: '📰',
    desc: 'You overweight recent events when making decisions. A bad week feels like the end; a good week feels like it\'ll last forever. Both feelings mislead you into buying high and selling low.'
  },
  herd_mentality: {
    name: 'Crowd Follower',
    icon: '🐑',
    desc: 'You look to others for cues on what to do with money. Social proof is powerful — but in markets, the crowd is most wrong at the most critical turning points.'
  },
  overconfidence: {
    name: 'Overconfident Trader',
    icon: '🦁',
    desc: 'You overestimate your ability to predict markets. After a good run, markets feel predictable. They never are. Overconfidence leads to concentrated bets and heavy losses.'
  },
  anchoring: {
    name: 'Price Anchor',
    icon: '⚓',
    desc: 'You anchor decisions to arbitrary reference prices — usually your purchase price. "I won\'t sell until it comes back to ₹500" is anchoring. The market doesn\'t care what you paid.'
  },
  balanced: {
    name: 'Informed Skeptic',
    icon: '🧭',
    desc: 'You show balanced responses across all bias dimensions. You already think like a long-term investor. InvestIQ will help pressure-test these instincts in real market scenarios.'
  },
  // Backend generated profiles for users who skip the fearless assessment
  Beginner: {
    name: 'Beginner',
    icon: '🌱',
    desc: 'You are just starting out. Build confidence and find your investing style through simulated experience.'
  },
  Balanced: { name: 'Balanced', icon: '⚖️', desc: 'You have a balanced approach to investing.' },
  Overthinker: { name: 'Overthinker', icon: '🤔', desc: 'You tend to overthink decisions.' },
  Cautious: { name: 'Cautious', icon: '🛡️', desc: 'You are a cautious investor.' },
  Aggressive: { name: 'Aggressive', icon: '🦁', desc: 'You lean toward aggressive strategies.' }
};

// ── STATIC FEAR QUESTIONS (fallback if Gemini is slow) ──
const QUESTIONS = [
  {
    q: 'Your ₹10,000 investment dropped to ₹7,200 in 8 days. Markets are falling everywhere. What do you do?',
    choices: [
      { text: 'Sell everything — protect what\'s left', bias: 'loss_aversion', weight: 25 },
      { text: 'Sell half — reduce risk, keep some exposure', bias: 'loss_aversion', weight: 12 },
      { text: 'Hold — markets always recover', bias: null, weight: 0 },
      { text: 'Buy more — this is a discount opportunity', bias: 'overconfidence', weight: 8 }
    ]
  },
  {
    q: 'Nifty 50 has fallen 5 days in a row. Your friend just sold all his mutual funds. What do you do?',
    choices: [
      { text: 'Sell too — if he\'s selling, there must be a reason', bias: 'herd_mentality', weight: 25 },
      { text: 'Wait and see what others do before deciding', bias: 'herd_mentality', weight: 14 },
      { text: 'Ignore it — I make my own decisions based on my goals', bias: null, weight: 0 },
      { text: 'Use it as a signal to buy more at lower prices', bias: null, weight: 0 }
    ]
  },
  {
    q: 'You bought a stock at ₹500. It\'s now ₹350. An expert says it may fall to ₹200. What do you do?',
    choices: [
      { text: 'Hold — won\'t sell until it comes back to ₹500', bias: 'anchoring', weight: 25 },
      { text: 'Sell some to recover part of my cost', bias: 'anchoring', weight: 12 },
      { text: 'Evaluate the fundamentals fresh, ignoring buy price', bias: null, weight: 0 },
      { text: 'Buy more — it must be cheap now', bias: 'overconfidence', weight: 10 }
    ]
  },
  {
    q: 'Markets crashed last month. This month they recovered 8%. You\'re still nervous. When do you invest?',
    choices: [
      { text: 'Wait for more recovery before I feel safe', bias: 'recency_bias', weight: 25 },
      { text: 'Invest a little — but keep most in FD just in case', bias: 'loss_aversion', weight: 15 },
      { text: 'Invest now — the recovery is underway', bias: null, weight: 0 },
      { text: 'I never invested — everything stays in savings', bias: 'loss_aversion', weight: 20 }
    ]
  },
  {
    q: 'A Telegram channel says "This stock will 3x in 3 months — buy NOW before it\'s too late." What do you do?',
    choices: [
      { text: 'Buy quickly — don\'t want to miss this', bias: 'herd_mentality', weight: 20 },
      { text: 'Ask friends if they\'ve heard about it, then decide', bias: 'herd_mentality', weight: 12 },
      { text: 'Ignore it — guaranteed returns are illegal claims', bias: null, weight: 0 },
      { text: 'Research the company myself before deciding', bias: null, weight: 0 }
    ]
  },
  {
    q: 'Your portfolio is up 45% this year. You\'re feeling very confident. What do you do next?',
    choices: [
      { text: 'Invest more aggressively — I understand markets well now', bias: 'overconfidence', weight: 25 },
      { text: 'Put a large lump sum in the best-performing fund', bias: 'overconfidence', weight: 18 },
      { text: 'Stay the course — my SIP continues as planned', bias: null, weight: 0 },
      { text: 'Rebalance portfolio to maintain original allocation', bias: null, weight: 0 }
    ]
  }
];

// ── STOCKS (fallback prices — overwritten with real Yahoo Finance data on load) ──
const STOCKS = [
  { id: 'nifty',   name: 'Nifty 50 ETF',  symbol: 'NIFTYBEES', yahooSymbol: 'NIFTYBEES.NS', price: 220,  sector: 'Index'   },
  { id: 'reli',    name: 'Reliance Ind.',  symbol: 'RELIANCE',  yahooSymbol: 'RELIANCE.NS',  price: 2850, sector: 'Energy'  },
  { id: 'tcs',     name: 'TCS',            symbol: 'TCS',       yahooSymbol: 'TCS.NS',       price: 3640, sector: 'IT'      },
  { id: 'hdfc',    name: 'HDFC Bank',      symbol: 'HDFCBANK',  yahooSymbol: 'HDFCBANK.NS',  price: 1680, sector: 'Banking' },
  { id: 'info',    name: 'Infosys',        symbol: 'INFY',      yahooSymbol: 'INFY.NS',      price: 1820, sector: 'IT'      },
  { id: 'zomato',  name: 'Zomato',         symbol: 'ZOMATO',    yahooSymbol: 'ETERNAL.NS',   price: 218,  sector: 'Tech'    },
  { id: 'sbi',     name: 'SBI',            symbol: 'SBIN',      yahooSymbol: 'SBIN.NS',      price: 780,  sector: 'Banking' },
  { id: 'adani',   name: 'Adani Ports',    symbol: 'ADANIPORTS',yahooSymbol: 'ADANIPORTS.NS',price: 1290, sector: 'Infra'   }
];

// ── CRASH DATA ───────────────────────────────────────────
const CRASHES = {
  covid: {
    name: 'COVID Crash — March 2020',
    shortName: 'COVID 2020',
    desc: 'Nifty 50 fell 38% in 40 trading days',
    drop: '−38%',
    period: 'Feb 19 – Mar 23, 2020',
    data: [11132,11100,10989,10900,10750,10600,10458,10200,9955,9600,9197,8900,8745,8500,8300,7800,7610,7700,7801,7900,8050,8200,8318,8250,8083,7993,8084,7992,8100,8200,8253,8400,8500,8599,8500,8261,8400,8600,8925,9154],
    events: {
      2:  'WHO declares COVID-19 a pandemic',
      5:  'NSE triggers circuit breakers — trading halted',
      8:  'Sensex loses 2,919 points — worst single-day fall',
      11: 'PM Modi announces 21-day national lockdown',
      15: 'RBI cuts repo rate 75bps in emergency meeting',
      20: 'Stimulus packages announced — first signs of stability',
      28: 'Nifty recovers above 9,000 — institutional buying',
      35: 'FII inflows return — recovery confirmed'
    }
  },
  adani: {
    name: 'Adani Selloff — Jan 2023',
    shortName: 'Adani 2023',
    desc: 'Adani group stocks fell 60%+ in 3 weeks after Hindenburg report',
    drop: '−60%',
    period: 'Jan 24 – Feb 14, 2023',
    data: [100,97,93,88,82,76,70,65,60,56,53,50,48,46,45,44,43,42,41,40,40.5,41,42,43,44],
    events: {
      0:  'Hindenburg Research publishes damning report on Adani Group',
      3:  'Adani stocks circuit-locked. ₹5 lakh crore market cap wiped',
      6:  'Adani cancels ₹20,000 crore FPO amid pressure',
      10: 'SEBI begins investigation into Adani group',
      15: 'GQG Partners invests $1.87B — first institutional confidence signal',
      20: 'Slow recovery begins as fears ease'
    }
  },
  gfc: {
    name: '2008 Global Financial Crisis',
    shortName: 'GFC 2008',
    desc: 'Nifty fell 60% over 11 months as global markets collapsed',
    drop: '−60%',
    period: 'Jan 2008 – Nov 2008',
    data: [6200,6100,5900,5800,5600,5400,5200,5000,4800,4700,4600,4500,4400,4300,4200,4100,4000,3900,3800,3700,3600,3500,3400,3300,3200,3100,3000,2900,2800,2700,2600,2500,2600,2700,2650,2600,2700,2800,2750,2800],
    events: {
      5:  'Bear Stearns collapses — global contagion fears begin',
      12: 'Lehman Brothers files for bankruptcy — global panic',
      18: 'Indian banking stocks in freefall',
      22: 'RBI cuts rates as recession fears hit India',
      28: 'Global stimulus packages announced',
      35: 'Warren Buffett: "Be greedy when others are fearful"'
    }
  },
  paytm: {
    name: 'Paytm IPO Collapse — Nov 2021',
    shortName: 'Paytm 2021',
    desc: 'Paytm fell 27% on listing day — India\'s biggest IPO flop',
    drop: '−27%',
    period: 'Nov 18–30, 2021',
    data: [2150,1961,1800,1680,1600,1560,1540,1520,1505,1490,1480,1470,1460,1450,1440,1430,1420,1410,1400,1390,1385,1380,1375,1370,1365,1360,1355,1350,1360,1370],
    events: {
      0:  'Paytm lists at ₹1,955 — already below ₹2,150 issue price',
      1:  'Falls to ₹1,800 within hours. Analysts in shock.',
      3:  'CNBC: "Where did the money go?" — retail investor losses mount',
      8:  'Management defends long-term vision. Market unimpressed.',
      15: 'Stock stabilizes but 36% below issue price',
      25: 'Lesson: IPO hype ≠ company value'
    }
  }
};

// ── BIAS TIPS ────────────────────────────────────────────
const BIAS_TIPS = {
  loss_aversion: [
    { title: 'The 10-year rule', text: 'Before selling, ask: "Will I regret this in 10 years?" Studies show 90% of panic-sell decisions are regretted within 12 months.' },
    { title: 'Frame losses as tuition', text: 'A ₹5,000 paper loss is tuition for learning to hold. Real losses from premature selling are far more expensive long-term.' },
    { title: 'Check your time horizon', text: 'If your goal is 5+ years away, a 20% drop is irrelevant. Nifty 50 has never given negative returns over any 10-year period in history.' }
  ],
  recency_bias: [
    { title: 'Read history, not today\'s news', text: 'The last 30 days are statistically meaningless for long-term investors. Read about 2008, 2020, 2013 before acting on today\'s headlines.' },
    { title: 'Set a 48-hour waiting period', text: 'Never make an investment decision within 48 hours of reading negative financial news. The urgency you feel is artificial.' },
    { title: 'SIP is the antidote', text: 'Systematic Investment Plans force you to invest on schedule, not on emotion. Best SIP performance comes from holding through bad months.' }
  ],
  herd_mentality: [
    { title: 'Track who is selling — and why', text: 'When everyone is selling, institutions are buying. The crowd is most wrong at the most critical market turning points.' },
    { title: 'Write your investment thesis', text: 'Before investing, write 2 sentences on why you\'re buying. If the reason hasn\'t changed, the price change doesn\'t matter.' },
    { title: 'Avoid financial WhatsApp groups', text: 'Group chats amplify fear and FOMO simultaneously. Your best financial decisions come from quiet analysis, not group pressure.' }
  ],
  overconfidence: [
    { title: 'Track all your calls — not just winners', text: 'Overconfidence is maintained by remembering wins and forgetting losses. Record every prediction and check accuracy after 6 months.' },
    { title: 'Never put more than 10% in one stock', text: 'Diversification is not for cowards. It\'s the only free lunch in investing — Nobel laureate Harry Markowitz.' },
    { title: 'Read about LTCM and Archegos', text: 'The smartest traders in the world have blown up due to overconfidence. Humility is a survival skill in markets.' }
  ],
  anchoring: [
    { title: 'Evaluate every position from zero', text: 'Ask: "If I had cash today, would I buy this at today\'s price?" If no, sell it. Your original purchase price is irrelevant.' },
    { title: 'Separate identity from portfolio', text: 'Anchoring is partly an ego defense — admitting a loss feels like admitting a mistake. Your intelligence is not your portfolio.' },
    { title: 'Use stop-losses, not hope', text: 'Decide your exit price before you enter. "I\'ll hold till it comes back" is how ₹50,000 becomes ₹8,000.' }
  ],
  balanced: [
    { title: 'You\'re ahead of 90% of retail investors', text: 'Your responses suggest rational, long-term thinking. The challenge is maintaining this under the emotional pressure of real money.' },
    { title: 'Pressure-test your discipline', text: 'Complete all crash replays. Your balanced thinking in theory may shift under a simulated −40% crash with emotional context.' },
    { title: 'Help others understand behavioral finance', text: 'Teaching reinforces your own discipline. Share what you learn from InvestIQ with friends who are afraid to invest.' }
  ]
};

// ── PEER STATS for checkpoints ───────────────────────────
const PEER_STATS = {
  10: '58% of users sold at this point — most regretted it within 3 weeks',
  20: '71% of users panic-sold here — the market recovered 3 months later',
  30: '82% of users exited — the ones who held saw full recovery + 20% gains'
};

const CP_CONTEXTS = {
  10: 'Markets have been falling for days. WhatsApp groups are full of panic. News anchors say the worst is yet to come.',
  20: 'The economy looks terrible. Every expert on TV is calling it a collapse. Your portfolio is deeply in the red.',
  30: 'Nifty is at multi-year lows. Every analyst says it will fall further. Your savings feel like they\'re disappearing daily.'
};

// ── DEMO COACH RESPONSES (when AI is loading) ────────────
const DEMO_RESPONSES = {
  english: {
    'loss aversion':     'Loss aversion means you feel the pain of a ₹1,000 loss roughly twice as intensely as the pleasure of a ₹1,000 gain. Discovered by Kahneman & Tversky, it\'s the #1 reason Indian retail investors underperform — they sell during dips that later recover fully.',
    'sip':               'A SIP (Systematic Investment Plan) invests a fixed amount — say ₹500 — every month, regardless of market conditions. When markets fall, you automatically buy more units at lower prices (rupee cost averaging). Time and consistency beat market timing every single time.',
    'nifty':             'Nifty 50 is India\'s benchmark index of the 50 largest companies. Over any 10-year period in history, it has delivered ~12% annual returns. For a first-time investor with a 5–10 year goal, a Nifty 50 index fund is one of the safest starting points.',
    'portfolio dropped':  'Short-term drops of 5–20% are completely normal — they happen every single year. What matters is your time horizon. If your goal is 5+ years away, today\'s drop is financially meaningless. The danger is in reacting emotionally to temporary noise.',
    default:             'Great question! The core principle: your emotions are not your enemy — they just need training. Every time you hold through a simulated dip in InvestIQ, you\'re building the emotional muscle that separates long-term wealth-builders from panic-sellers.'
  },
  hindi: {
    default: 'बहुत अच्छा सवाल! निवेश में सबसे बड़ी रुकावट डर है — खासकर पैसे खोने का डर। लेकिन असली जोखिम यह है कि आप बिल्कुल निवेश न करें और आपकी बचत महंगाई से कम होती रहे। हर बार जब आप सिमुलेशन में गिरावट के दौरान होल्ड करते हैं, आप एक जरूरी आदत बना रहे हैं जो असली निवेश में काम आएगी।'
  },
  punjabi: {
    default: 'ਬਹੁਤ ਵਧੀਆ ਸਵਾਲ! ਨਿਵੇਸ਼ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਡੀ ਰੁਕਾਵਟ ਡਰ ਹੈ। ਪਰ ਅਸਲ ਖ਼ਤਰਾ ਇਹ ਹੈ ਕਿ ਤੁਸੀਂ ਬਿਲਕੁਲ ਨਿਵੇਸ਼ ਨਾ ਕਰੋ ਅਤੇ ਮਹਿੰਗਾਈ ਤੁਹਾਡੀਆਂ ਬੱਚਤਾਂ ਨੂੰ ਖਾਂਦੀ ਰਹੇ। ਹਰ ਵਾਰ ਜਦੋਂ ਤੁਸੀਂ ਗਿਰਾਵਟ ਦੌਰਾਨ ਹੋਲਡ ਕਰਦੇ ਹੋ, ਤੁਸੀਂ ਅਸਲ ਨਿਵੇਸ਼ ਲਈ ਤਿਆਰੀ ਕਰ ਰਹੇ ਹੋ।'
  }
};
