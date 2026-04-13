'use strict';

const WebSocket = require('ws');
const { getPrice, TRENDING_SYMBOLS } = require('./market.service');
const logger = require('../config/logger');

let wss = null;
let broadcastInterval = null;

/**
 * Initialise WebSocket server on the same HTTP server.
 * Clients receive live (or cached) price ticks every 5 seconds.
 */
const initWebSocket = (httpServer) => {
  wss = new WebSocket.Server({ server: httpServer });

  wss.on('connection', (ws, req) => {
    const ip = req.socket.remoteAddress;
    logger.info(`[WS] Client connected: ${ip}`);

    ws.send(JSON.stringify({ type: 'connected', message: 'InvestoCoach live prices 🚀' }));

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw);
        // Client can subscribe to specific symbols: { type: 'subscribe', symbols: ['AAPL','TSLA'] }
        if (msg.type === 'subscribe' && Array.isArray(msg.symbols)) {
          ws.subscribedSymbols = msg.symbols.map((s) => s.toUpperCase());
          logger.debug(`[WS] ${ip} subscribed to: ${ws.subscribedSymbols.join(', ')}`);
        }
      } catch (_) {
        // ignore malformed messages
      }
    });

    ws.on('close', () => logger.info(`[WS] Client disconnected: ${ip}`));
    ws.on('error', (err) => logger.error(`[WS] Error: ${err.message}`));
  });

  // Broadcast prices every 5 seconds
  broadcastInterval = setInterval(async () => {
    if (wss.clients.size === 0) return;

    const symbols = TRENDING_SYMBOLS;
    const prices = await Promise.allSettled(symbols.map((s) => getPrice(s)));

    const payload = {
      type: 'price_update',
      timestamp: new Date().toISOString(),
      data: prices
        .map((p, i) => (p.status === 'fulfilled' ? { symbol: symbols[i], ...p.value } : null))
        .filter(Boolean),
    };

    wss.clients.forEach((client) => {
      if (client.readyState !== WebSocket.OPEN) return;

      // Filter by subscribed symbols if client specified any
      let data = payload.data;
      if (client.subscribedSymbols?.length) {
        data = payload.data.filter((d) => client.subscribedSymbols.includes(d.symbol));
      }

      client.send(JSON.stringify({ ...payload, data }));
    });
  }, 5000);

  logger.info('[WS] WebSocket server initialised');

  return wss;
};

const getWSS = () => wss;

const closeWebSocket = () => {
  if (broadcastInterval) clearInterval(broadcastInterval);
  if (wss) wss.close(() => logger.info('[WS] WebSocket server closed'));
};

module.exports = { initWebSocket, getWSS, closeWebSocket };
