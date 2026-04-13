'use strict';

const supabase = require('../config/supabase');
const marketService = require('../services/market.service');

// ── Helper ────────────────────────────────────────────────────────────────────
const getOrCreatePortfolio = async (userId) => {
  const { data: portfolio } = await supabase
    .from('portfolios')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (portfolio) return portfolio;

  const { data: created } = await supabase
    .from('portfolios')
    .insert({ user_id: userId, cash_balance: Number(process.env.DEFAULT_PORTFOLIO_AMOUNT) || 10000 })
    .select()
    .single();

  return created;
};

// ── GET /portfolio ────────────────────────────────────────────────────────────
const getPortfolio = async (req, res) => {
  const portfolio = await getOrCreatePortfolio(req.user.id);
  const holdings  = Array.isArray(portfolio.holdings)  ? portfolio.holdings  : [];
  const txns      = Array.isArray(portfolio.transactions) ? portfolio.transactions : [];

  // Refresh live prices for all holdings
  const priceResults = await Promise.allSettled(
    holdings.map((h) => marketService.getPrice(h.symbol))
  );

  const enrichedHoldings = holdings.map((h, i) => {
    const currentPrice =
      priceResults[i].status === 'fulfilled' ? priceResults[i].value.price : h.avg_buy_price;
    return {
      symbol:        h.symbol,
      quantity:      h.quantity,
      avgBuyPrice:   h.avg_buy_price,
      currentPrice,
      currentValue:  parseFloat((h.quantity * currentPrice).toFixed(2)),
      unrealisedPnL: parseFloat((h.quantity * (currentPrice - h.avg_buy_price)).toFixed(2)),
    };
  });

  const holdingsValue = enrichedHoldings.reduce((s, h) => s + h.currentValue, 0);

  res.json({
    success: true,
    portfolio: {
      cashBalance:        portfolio.cash_balance,
      holdingsValue:      parseFloat(holdingsValue.toFixed(2)),
      totalValue:         parseFloat((portfolio.cash_balance + holdingsValue).toFixed(2)),
      realisedPnL:        portfolio.realised_pnl,
      holdings:           enrichedHoldings,
      recentTransactions: txns.slice(-10).reverse(),
    },
  });
};

// ── POST /portfolio/buy ───────────────────────────────────────────────────────
const buyAsset = async (req, res) => {
  const { symbol, quantity } = req.body;
  const sym = symbol.toUpperCase();

  const market = await marketService.getPrice(sym);
  const price  = market.price;
  const total  = parseFloat((price * quantity).toFixed(2));

  const portfolio = await getOrCreatePortfolio(req.user.id);

  if (portfolio.cash_balance < total) {
    return res.status(400).json({
      success: false,
      message: `Insufficient balance. Required: ₹${total}, Available: ₹${portfolio.cash_balance.toFixed(2)}`,
    });
  }

  const holdings = Array.isArray(portfolio.holdings) ? [...portfolio.holdings] : [];
  const existing = holdings.find((h) => h.symbol === sym);

  if (existing) {
    const totalQty         = existing.quantity + quantity;
    existing.avg_buy_price = parseFloat(
      ((existing.avg_buy_price * existing.quantity + price * quantity) / totalQty).toFixed(2)
    );
    existing.quantity      = totalQty;
  } else {
    holdings.push({ symbol: sym, quantity, avg_buy_price: price });
  }

  const transactions = [
    ...(Array.isArray(portfolio.transactions) ? portfolio.transactions : []),
    { type: 'buy', symbol: sym, quantity, price, total, executed_at: new Date().toISOString() },
  ];

  const newBalance = parseFloat((portfolio.cash_balance - total).toFixed(2));

  await supabase
    .from('portfolios')
    .update({ cash_balance: newBalance, holdings, transactions })
    .eq('user_id', req.user.id);

  res.status(201).json({
    success: true,
    message: `Bought ${quantity} units of ${sym} at ₹${price}`,
    transaction: { symbol: sym, quantity, price, total },
    newCashBalance: newBalance,
  });
};

// ── POST /portfolio/sell ──────────────────────────────────────────────────────
const sellAsset = async (req, res) => {
  const { symbol, quantity } = req.body;
  const sym = symbol.toUpperCase();

  const portfolio = await getOrCreatePortfolio(req.user.id);
  const holdings  = Array.isArray(portfolio.holdings) ? [...portfolio.holdings] : [];
  const holding   = holdings.find((h) => h.symbol === sym);

  if (!holding || holding.quantity < quantity) {
    return res.status(400).json({
      success: false,
      message: `Insufficient holdings. You own ${holding?.quantity ?? 0} units of ${sym}`,
    });
  }

  const market = await marketService.getPrice(sym);
  const price  = market.price;
  const total  = parseFloat((price * quantity).toFixed(2));
  const pnl    = parseFloat(((price - holding.avg_buy_price) * quantity).toFixed(2));

  holding.quantity -= quantity;
  const updatedHoldings = holding.quantity === 0
    ? holdings.filter((h) => h.symbol !== sym)
    : holdings;

  const transactions = [
    ...(Array.isArray(portfolio.transactions) ? portfolio.transactions : []),
    { type: 'sell', symbol: sym, quantity, price, total, realised_pnl: pnl, executed_at: new Date().toISOString() },
  ];

  const newBalance    = parseFloat((portfolio.cash_balance + total).toFixed(2));
  const newRealisedPnL = parseFloat((portfolio.realised_pnl + pnl).toFixed(2));

  await supabase
    .from('portfolios')
    .update({ cash_balance: newBalance, holdings: updatedHoldings, transactions, realised_pnl: newRealisedPnL })
    .eq('user_id', req.user.id);

  res.json({
    success: true,
    message: `Sold ${quantity} units of ${sym} at ₹${price}`,
    transaction: { symbol: sym, quantity, price, total, realisedPnL: pnl },
    newCashBalance: newBalance,
  });
};

module.exports = { getPortfolio, buyAsset, sellAsset };
