'use strict';

const marketService = require('../services/market.service');

// ── GET /market/price?symbol=AAPL ─────────────────────────────────────────────
const getPrice = async (req, res) => {
  const symbol = (req.query.symbol || '').toUpperCase().trim();
  if (!symbol) {
    return res.status(400).json({ success: false, message: 'Query param "symbol" is required' });
  }
  const data = await marketService.getPrice(symbol);
  res.json({ success: true, data });
};

// ── GET /market/trending ──────────────────────────────────────────────────────
const getTrending = async (_req, res) => {
  const data = await marketService.getTrending();
  res.json({ success: true, count: data.length, data });
};

module.exports = { getPrice, getTrending };
