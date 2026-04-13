'use strict';

const { getPrice } = require('./market.service');
const logger = require('../config/logger');

// ── Scenario configurations ───────────────────────────────────────────────────
const SCENARIO_CONFIG = {
  MarketCrash: {
    multiplierMin: 0.70,
    multiplierMax: 0.90,
    trend: 'down',
    description: 'Markets are crashing. Panic is spreading.',
    durationSteps: 10,
  },
  BullRun: {
    multiplierMin: 1.05,
    multiplierMax: 1.20,
    trend: 'up',
    description: 'Markets are surging with strong optimism.',
    durationSteps: 10,
  },
  VolatilitySpike: {
    multiplierMin: 0.85,
    multiplierMax: 1.15,
    trend: 'mixed',
    description: 'Extreme volatility – prices are swinging wildly.',
    durationSteps: 12,
  },
  Neutral: {
    multiplierMin: 0.99,
    multiplierMax: 1.01,
    trend: 'flat',
    description: 'Markets are stable with minimal movement.',
    durationSteps: 8,
  },
};

/**
 * Return random multiplier within the scenario range.
 * VolatilitySpike oscillates each step.
 */
const getMultiplier = (scenario, step) => {
  const config = SCENARIO_CONFIG[scenario];
  if (!config) throw new Error(`Unknown scenario: ${scenario}`);

  if (scenario === 'VolatilitySpike') {
    // Oscillate between min and max
    return step % 2 === 0 ? config.multiplierMin : config.multiplierMax;
  }

  const { multiplierMin: min, multiplierMax: max } = config;
  return parseFloat((Math.random() * (max - min) + min).toFixed(4));
};

/**
 * Build a simulated price tick for a given symbol at the current step.
 */
const buildPriceTick = async (symbol, scenario, step) => {
  const market = await getPrice(symbol);
  const multiplier = getMultiplier(scenario, step);
  const simulatedPrice = parseFloat((market.price * multiplier).toFixed(2));

  return {
    symbol,
    realPrice: market.price,
    simulatedPrice,
    multiplier,
    changePercent: market.changePercent,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Build ticks for all symbols in the session.
 */
const buildStepTicks = async (symbols, scenario, step) => {
  const ticks = await Promise.all(symbols.map((s) => buildPriceTick(s, scenario, step)));
  return ticks;
};

/**
 * Compute a panic score for the session based on behavior logs.
 * panicScore = (# panic decisions / total decisions) * 100
 */
const computePanicScore = (behaviorLogs) => {
  if (!behaviorLogs || behaviorLogs.length === 0) return 0;
  const panicCount = behaviorLogs.filter((b) => b.isPanicDecision).length;
  return Math.round((panicCount / behaviorLogs.length) * 100);
};

/**
 * Compute performance score based on portfolio change during simulation.
 * portfolioStartValue → portfolioEndValue
 */
const computePerformanceScore = (startValue, endValue) => {
  if (!startValue || startValue === 0) return 0;
  return parseFloat((((endValue - startValue) / startValue) * 100).toFixed(2));
};

const getScenarioConfig = (scenario) => SCENARIO_CONFIG[scenario] || null;

module.exports = {
  buildStepTicks,
  buildPriceTick,
  computePanicScore,
  computePerformanceScore,
  getScenarioConfig,
  SCENARIO_CONFIG,
};
