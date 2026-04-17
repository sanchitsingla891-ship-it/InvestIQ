'use strict';

const axios     = require('axios');
const NodeCache = require('node-cache');
const supabase  = require('../config/supabase');
const logger    = require('../config/logger');

// Primary in-memory cache (TTL from env, default 10 s)
const memCache = new NodeCache({ stdTTL: Number(process.env.MARKET_CACHE_TTL) || 10 });

// Indian NSE symbols used by the Sandbox Simulator
const SANDBOX_SYMBOLS = [
  { id: 'nifty',  yahoo: 'NIFTYBEES.NS', display: 'NIFTYBEES' },
  { id: 'reli',   yahoo: 'RELIANCE.NS',  display: 'RELIANCE'  },
  { id: 'tcs',    yahoo: 'TCS.NS',       display: 'TCS'       },
  { id: 'hdfc',   yahoo: 'HDFCBANK.NS',  display: 'HDFCBANK'  },
  { id: 'info',   yahoo: 'INFY.NS',      display: 'INFY'      },
  { id: 'zomato', yahoo: 'ETERNAL.NS',    display: 'ZOMATO'    },
  { id: 'sbi',    yahoo: 'SBIN.NS',      display: 'SBIN'      },
  { id: 'adani',  yahoo: 'ADANIPORTS.NS',display: 'ADANIPORTS' }
];

// All symbols for WebSocket broadcast
const TRENDING_SYMBOLS = SANDBOX_SYMBOLS.map(s => s.display);

// ── Fetch live data from Yahoo Finance (free, no API key) ─────────────────────
const fetchFromYahoo = async (yahooSymbol, displaySymbol) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahooSymbol)}?interval=1d&range=1d`;

  const { data } = await axios.get(url, {
    timeout: 8000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  });

  const result = data.chart?.result?.[0];
  if (!result) throw new Error(`No Yahoo data for ${yahooSymbol}`);

  const meta = result.meta;
  const price = meta.regularMarketPrice;
  const prevClose = meta.chartPreviousClose || meta.previousClose || price;
  const changePercent = prevClose ? ((price - prevClose) / prevClose * 100) : 0;

  return {
    symbol:        displaySymbol || meta.symbol.replace('.NS', '').replace('.BO', ''),
    price:         price,
    changePercent: Math.round(changePercent * 100) / 100,
    high:          meta.regularMarketDayHigh || price,
    low:           meta.regularMarketDayLow || price,
    open:          meta.regularMarketOpen || price,
    previousClose: prevClose,
    timestamp:     new Date().toISOString(),
    source:        'yahoo'
  };
};

// ── Fetch live data from Finnhub (fallback for US stocks) ─────────────────────
const fetchFromFinnhub = async (symbol) => {
  const apiKey  = process.env.FINNHUB_API_KEY;
  const baseUrl = process.env.FINNHUB_BASE_URL || 'https://finnhub.io/api/v1';

  const { data } = await axios.get(`${baseUrl}/quote?symbol=${symbol}&token=${apiKey}`, {
    timeout: 5000,
  });

  return {
    symbol:        symbol.toUpperCase(),
    price:         data.c,
    changePercent: data.dp,
    high:          data.h,
    low:           data.l,
    open:          data.o,
    previousClose: data.pc,
    timestamp:     new Date().toISOString(),
    source:        'finnhub'
  };
};

// ── 3-tier cache: memory → Supabase → Yahoo/Finnhub ──────────────────────────
const getPrice = async (symbol) => {
  const key = symbol.toUpperCase();

  // 1. In-memory cache
  const cached = memCache.get(key);
  if (cached) {
    return { ...cached, cached: true };
  }

  // 2. Supabase cache
  try {
    const { data: dbRow } = await supabase
      .from('market_cache')
      .select('*')
      .eq('symbol', key)
      .maybeSingle();

    if (dbRow) {
      const ageMs = Date.now() - new Date(dbRow.fetched_at).getTime();
      const ttlMs = (Number(process.env.MARKET_CACHE_TTL) || 10) * 1000;

      if (ageMs < ttlMs) {
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
  } catch (err) {
    logger.warn(`[MarketService] Supabase cache read failed: ${err.message}`);
  }

  // 3. Determine which API to use — check if it's an Indian stock
  const sandboxEntry = SANDBOX_SYMBOLS.find(s => s.display === key);
  let priceData;

  try {
    if (sandboxEntry) {
      // Indian stock → Yahoo Finance
      priceData = await fetchFromYahoo(sandboxEntry.yahoo, sandboxEntry.display);
    } else {
      // US/other stock → Finnhub
      priceData = await fetchFromFinnhub(key);
    }
  } catch (err) {
    logger.error(`[MarketService] Live fetch failed for ${key}: ${err.message}`);
    throw err;
  }

  // Persist to in-memory cache
  memCache.set(key, priceData);

  // Upsert into Supabase market_cache (fire-and-forget)
  supabase.from('market_cache').upsert(
    {
      symbol:         key,
      price:          priceData.price,
      change_percent: priceData.changePercent,
      high:           priceData.high,
      low:            priceData.low,
      open_price:     priceData.open,
      previous_close: priceData.previousClose,
      source:         priceData.source || 'yahoo',
      fetched_at:     new Date().toISOString(),
    },
    { onConflict: 'symbol' }
  ).then(() => {}).catch(err => logger.warn(`[MarketService] Supabase upsert failed: ${err.message}`));

  return { ...priceData, cached: false };
};

// ── Get all sandbox stock prices in one call ─────────────────────────────────
const getSandboxPrices = async () => {
  const results = await Promise.allSettled(
    SANDBOX_SYMBOLS.map(s => getPrice(s.display))
  );

  return SANDBOX_SYMBOLS.map((s, i) => {
    const r = results[i];
    if (r.status === 'fulfilled' && r.value.price) {
      return {
        id:            s.id,
        symbol:        s.display,
        price:         r.value.price,
        changePercent: r.value.changePercent || 0,
        high:          r.value.high,
        low:           r.value.low,
        source:        r.value.source || 'yahoo'
      };
    }
    // Return null for failed fetches — frontend will use fallback
    return null;
  }).filter(Boolean);
};

// ── Trending: all symbols in parallel ────────────────────────────────────────
const getTrending = async () => {
  const results = await Promise.allSettled(TRENDING_SYMBOLS.map(s => getPrice(s)));
  return results
    .filter(r => r.status === 'fulfilled')
    .map(r => r.value);
};

module.exports = { getPrice, getTrending, getSandboxPrices, TRENDING_SYMBOLS, SANDBOX_SYMBOLS };
