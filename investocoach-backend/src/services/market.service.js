'use strict';

const axios     = require('axios');
const NodeCache = require('node-cache');
const supabase  = require('../config/supabase');
const logger    = require('../config/logger');

// Primary in-memory cache (TTL from env, default 10 s)
const memCache = new NodeCache({ stdTTL: Number(process.env.MARKET_CACHE_TTL) || 10 });

const TRENDING_SYMBOLS = ['AAPL', 'TSLA', 'MSFT', 'GOOGL', 'AMZN', 'TCS', 'INFY', 'RELIANCE'];

// ── Fetch live data from Finnhub ──────────────────────────────────────────────
const fetchFromFinnhub = async (symbol) => {
  const apiKey  = process.env.FINNHUB_API_KEY;
  const baseUrl = process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1';

  const { data } = await axios.get(`${baseUrl}/quote?symbol=${symbol}&token=${apiKey}`, {
    timeout: 5000,
  });

  // Finnhub: { c: current, dp: change%, h, l, o, pc }
  return {
    symbol:        symbol.toUpperCase(),
    price:         data.c,
    changePercent: data.dp,
    high:          data.h,
    low:           data.l,
    open:          data.o,
    previousClose: data.pc,
    timestamp:     new Date().toISOString(),
  };
};

// ── 3-tier cache: memory → Supabase → Finnhub ────────────────────────────────
const getPrice = async (symbol) => {
  const key = symbol.toUpperCase();

  // 1. In-memory cache
  const cached = memCache.get(key);
  if (cached) {
    logger.debug(`[MarketService] Cache HIT (mem): ${key}`);
    return { ...cached, cached: true };
  }

  // 2. Supabase cache
  const { data: dbRow } = await supabase
    .from('market_cache')
    .select('*')
    .eq('symbol', key)
    .maybeSingle();

  if (dbRow) {
    const ageMs = Date.now() - new Date(dbRow.fetched_at).getTime();
    const ttlMs = (Number(process.env.MARKET_CACHE_TTL) || 10) * 1000;

    if (ageMs < ttlMs) {
      logger.debug(`[MarketService] Cache HIT (supabase): ${key}`);
      const result = {
        symbol:        dbRow.symbol,
        price:         dbRow.price,
        changePercent: dbRow.change_percent,
        high:          dbRow.high,
        low:           dbRow.low,
        open:          dbRow.open_price,
        previousClose: dbRow.previous_close,
        timestamp:     dbRow.fetched_at,
      };
      memCache.set(key, result);
      return { ...result, cached: true };
    }
  }

  // 3. Live Finnhub API
  logger.debug(`[MarketService] Fetching live data: ${key}`);
  const data = await fetchFromFinnhub(key);

  // Persist to in-memory cache
  memCache.set(key, data);

  // Upsert into Supabase market_cache
  await supabase.from('market_cache').upsert(
    {
      symbol:         key,
      price:          data.price,
      change_percent: data.changePercent,
      high:           data.high,
      low:            data.low,
      open_price:     data.open,
      previous_close: data.previousClose,
      source:         'finnhub',
      fetched_at:     new Date().toISOString(),
    },
    { onConflict: 'symbol' }
  );

  return { ...data, cached: false };
};

// ── Trending: all symbols in parallel ────────────────────────────────────────
const getTrending = async () => {
  const results = await Promise.allSettled(TRENDING_SYMBOLS.map((s) => getPrice(s)));
  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => r.value);
};

module.exports = { getPrice, getTrending, TRENDING_SYMBOLS };
