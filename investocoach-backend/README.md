# InvestoCoach Backend 🚀

> A behavioral investment simulation backend for first-time investors – fintech hackathon project.

---

## Project Structure

```
investocoach-backend/
├── src/
│   ├── app.js                      # Express entry point + WebSocket init
│   ├── config/
│   │   ├── db.js                   # MongoDB connection
│   │   └── logger.js               # Winston logger
│   ├── models/
│   │   ├── User.js                 # User profile + fear score
│   │   ├── SimulationSession.js    # Simulation state + price history
│   │   ├── BehaviorLog.js          # Per-decision tracking
│   │   ├── Portfolio.js            # Sandbox portfolio
│   │   └── MarketCache.js          # Persistent price cache (TTL)
│   ├── middleware/
│   │   ├── auth.js                 # JWT protect middleware
│   │   ├── errorHandler.js         # Global error handler
│   │   └── validate.js             # express-validator pipe
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── market.controller.js
│   │   ├── simulation.controller.js
│   │   ├── behavior.controller.js
│   │   ├── recommendation.controller.js
│   │   ├── portfolio.controller.js
│   │   └── progress.controller.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── market.routes.js
│   │   ├── simulation.routes.js
│   │   ├── behavior.routes.js
│   │   ├── recommendation.routes.js
│   │   ├── portfolio.routes.js
│   │   └── progress.routes.js
│   └── services/
│       ├── market.service.js       # 3-tier cache: mem → MongoDB → Finnhub
│       ├── simulation.service.js   # Scenario engine + price tick builder
│       ├── behavior.service.js     # Panic analysis + fear score delta
│       ├── recommendation.service.js  # Asset bucket recommender
│       └── websocket.service.js    # Real-time price broadcast (WS)
├── logs/                           # Winston log files (auto-created)
├── .env.example
├── .gitignore
└── package.json
```

---

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your values:
#   MONGO_URI, JWT_SECRET, FINNHUB_API_KEY
```

### 3. Run Development Server
```bash
npm run dev
```
Server starts at `http://localhost:5000`

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/signup` | ❌ | Register new user |
| POST | `/auth/login` | ❌ | Login + get JWT |

### User
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/user/profile` | ✅ | Get full profile + fear score |
| PATCH | `/user/profile` | ✅ | Update name/risk preference |

### Market Data
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/market/price?symbol=AAPL` | ✅ | Live/cached price |
| GET | `/market/trending` | ✅ | 8 trending symbols |

### Simulation Engine
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/simulation/start` | ✅ | Start scenario session |
| POST | `/simulation/step` | ✅ | Advance one step |
| GET | `/simulation/status` | ✅ | Active session status |

### Behavior Tracking
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/behavior/log` | ✅ | Log buy/sell/hold decision |
| GET | `/behavior/report` | ✅ | Full behavioral analysis |

### Recommendations
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/recommendations` | ✅ | Personalized asset suggestions |

### Sandbox Portfolio
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/portfolio` | ✅ | Portfolio with live P&L |
| POST | `/portfolio/buy` | ✅ | Buy virtual asset |
| POST | `/portfolio/sell` | ✅ | Sell virtual asset |

### Progress
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/progress` | ✅ | Fear score trend + simulation history |

---

## Example Payloads

### POST /auth/signup
```json
{
  "name": "Rohan Sharma",
  "email": "rohan@example.com",
  "password": "secure123",
  "riskPreference": "low"
}
```
**Response**
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "user": { "fearScore": 50, "investorType": "Beginner" }
}
```

### POST /simulation/start
```json
{
  "scenario": "MarketCrash",
  "symbols": ["AAPL", "TSLA"]
}
```

### POST /behavior/log
```json
{
  "sessionId": "664abc...",
  "decisionType": "sell",
  "symbol": "AAPL",
  "priceAtDecision": 182.5,
  "reactionTimeMs": 1200
}
```

### GET /recommendations (response)
```json
{
  "fearScore": 65,
  "investorType": "Overthinker",
  "recommendation": {
    "assetType": "Low Risk",
    "examples": ["Debt Mutual Funds", "Blue-chip ETFs"],
    "suggestedAmount": 2000,
    "reason": "Based on your fear score of 65/100..."
  }
}
```

---

## WebSocket (Real-time Prices)

Connect to `ws://localhost:5000`

```js
const ws = new WebSocket('ws://localhost:5000');
ws.onopen = () => ws.send(JSON.stringify({ type: 'subscribe', symbols: ['AAPL', 'TSLA'] }));
ws.onmessage = (e) => console.log(JSON.parse(e.data));
```

Prices broadcast every **5 seconds**.

---

## Scenarios

| Scenario | Multiplier Range | Trend |
|----------|-----------------|-------|
| MarketCrash | 0.70 – 0.90 | ↓ Down |
| BullRun | 1.05 – 1.20 | ↑ Up |
| VolatilitySpike | 0.85 ↔ 1.15 | ↕ Oscillates |
| Neutral | 0.99 – 1.01 | → Flat |

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 5000 |
| `MONGO_URI` | MongoDB connection string | localhost/investocoach |
| `JWT_SECRET` | JWT signing secret | – |
| `JWT_EXPIRES_IN` | Token expiry | 7d |
| `FINNHUB_API_KEY` | Market data API key | – |
| `MARKET_CACHE_TTL` | Cache TTL in seconds | 10 |
| `DEFAULT_PORTFOLIO_AMOUNT` | Sandbox starting balance | 10000 |

---

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Cache**: node-cache (in-memory) + MongoDB TTL
- **Market Data**: Finnhub REST API
- **Real-time**: WebSocket (ws)
- **Logging**: Winston
- **Validation**: express-validator
- **Security**: helmet + cors + express-rate-limit
