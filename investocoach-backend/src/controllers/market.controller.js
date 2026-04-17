'use strict';

const marketService = require('../services/market.service');

// ── GET /market/price?symbol=RELIANCE ─────────────────────────────────────────
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

// ── GET /market/sandbox-prices (no auth — used by sandbox page on load) ───────
const getSandboxPrices = async (_req, res) => {
  try {
    const prices = await marketService.getSandboxPrices();
    res.json({ success: true, count: prices.length, prices });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch live prices', error: err.message });
  }
};

module.exports = { getPrice, getTrending, getSandboxPrices };
