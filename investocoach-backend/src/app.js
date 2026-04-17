'use strict';

require('dotenv').config();


const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

// Supabase client (initialises on import – exits if env vars missing)
require('./config/supabase');

const logger = require('./config/logger');
const errorHandler = require('./middleware/errorHandler');
const { initWebSocket } = require('./services/websocket.service');

// ── Route imports ────────────────────────────────────────────────────────────
const authRoutes           = require('./routes/auth.routes');
const userRoutes           = require('./routes/user.routes');
const marketRoutes         = require('./routes/market.routes');
const simulationRoutes     = require('./routes/simulation.routes');
const behaviorRoutes       = require('./routes/behavior.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const portfolioRoutes      = require('./routes/portfolio.routes');
const progressRoutes       = require('./routes/progress.routes');

// ── App bootstrap ─────────────────────────────────────────────────────────────
const app    = express();
const server = http.createServer(app);

// ── Global Middleware ─────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'] }));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

// Rate limiter – 100 requests / 15 min per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ── Health Check ──────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, message: 'InvestoCoach API is running 🚀', timestamp: new Date().toISOString() });
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth',            authRoutes);
app.use('/user',            userRoutes);
app.use('/market',          marketRoutes);
app.use('/simulation',      simulationRoutes);
app.use('/behavior',        behaviorRoutes);
app.use('/recommendations', recommendationRoutes);
app.use('/portfolio',       portfolioRoutes);
app.use('/progress',        progressRoutes);

// ── 404 Handler ───────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start Server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  logger.info(`🚀 InvestoCoach server running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

// WebSocket for real-time price updates
initWebSocket(server);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => process.exit(0));
});

module.exports = app;
