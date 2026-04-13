# InvestIQ — Practice Before You Pay

A behavioral-finance-first investment simulation platform for Gen-Z India.

## How to Run
1. Unzip the project folder
2. Open `index.html` in any modern browser (Chrome, Firefox, Edge)
3. No server required. No npm. No setup.

## Project Structure
```
investiq/
├── index.html              ← Entry point + all modals + sidebar
├── css/
│   ├── base.css            ← CSS variables, layout, grid, spacing
│   ├── components.css      ← Cards, buttons, badges, inputs, modals
│   └── pages.css           ← Page-specific styles
└── js/
    ├── state.js            ← Central app state (single source of truth)
    ├── gemini.js           ← Gemini AI integration (key baked in)
    ├── data.js             ← All static data: questions, stocks, crashes, profiles
    ├── utils.js            ← Shared helpers: toast, charts, formatting
    ├── onboarding.js       ← Fear Assessment quiz flow
    ├── sandbox.js          ← Live simulation, trading, checkpoints
    ├── crash.js            ← Crash replay engine (4 Indian market crashes)
    ├── coach.js            ← AI Coach chat (Hindi/English/Punjabi)
    ├── fincheck.js         ← Finfluencer Myth Buster
    └── app.js              ← Page routing, dashboard, debrief, graduation
```

## Features
| Feature | AI Powered | Notes |
|---|---|---|
| Fear Assessment | ✗ | 6 behavioral scenario questions → bias radar |
| Live Sandbox | ✗ | ₹1,00,000 virtual portfolio, 8 stocks, real-ish prices |
| Emotional Checkpoints | ✗ | Pauses at −10/−20/−30%, logs emotional decisions |
| Loss Probability Meter | ✗ | Shows Nifty 50 historical loss probability before buys |
| Crash Replay | ✗ | COVID 2020, Adani 2023, GFC 2008, Paytm 2021 |
| Behavioral Debrief | ✓ Gemini | Personalized analysis of your actual decisions |
| AI Coach | ✓ Gemini | Hindi/English/Punjabi chat |
| Finfluencer Checker | ✓ Gemini | Analyzes any stock tip for manipulation |
| Graduation Card | ✗ | Unlocks after 3 milestones, SIP recommendation |

## Gemini API
Key is integrated in `js/gemini.js` — no user input needed.
Model: `gemini-2.0-flash`

## Key Data Points Used in Pitch
- 79% of Indians prefer zero-risk returns (SEBI Investor Survey 2025)
- 63% aware of stocks, only 9.5% invest (SEBI 2025)
- 91% of retail F&O traders lost money in FY25 (SEBI)
- Fear of loss cited by 30–34% of non-investors as top barrier
