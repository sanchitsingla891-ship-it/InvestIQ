'use strict';

const WebSocket = require('ws');
const { getSandboxPrices, SANDBOX_SYMBOLS } = require('./market.service');
const logger = require('../config/logger');

let wss = null;
let broadcastInterval = null;

/**
 * Initialise WebSocket server on the same HTTP server.
 * Clients receive real NSE stock prices every 5 seconds.
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
        if (msg.type === 'subscribe' && Array.isArray(msg.symbols)) {
          ws.subscribedSymbols = msg.symbols.map(s => s.toUpperCase());
        }
      } catch (_) {
        // ignore malformed messages
      }
    });

    ws.on('close', () => logger.info(`[WS] Client disconnected: ${ip}`));
    ws.on('error', (err) => logger.error(`[WS] Error: ${err.message}`));
  });

  // Broadcast real prices every 5 seconds
  broadcastInterval = setInterval(async () => {
    if (wss.clients.size === 0) return;

    try {
      const prices = await getSandboxPrices();

      const payload = {
        type: 'price_update',
        timestamp: new Date().toISOString(),
        prices: prices.map(p => ({
          symbol:       p.symbol,
          currentPrice: p.price,
          changePercent: p.changePercent,
          id:           p.id
        }))
      };

      wss.clients.forEach((client) => {
        if (client.readyState !== WebSocket.OPEN) return;
        client.send(JSON.stringify(payload));
      });
    } catch (err) {
      logger.warn(`[WS] Price broadcast failed: ${err.message}`);
    }
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
