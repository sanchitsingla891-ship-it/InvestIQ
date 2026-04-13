'use strict';

const supabase = require('../config/supabase');
const behaviorService = require('../services/behavior.service');
const { deriveInvestorType } = require('./auth.controller');

// ── POST /behavior/log ────────────────────────────────────────────────────────
const logDecision = async (req, res) => {
  const {
    sessionId,
    decisionType,
    symbol,
    priceAtDecision,
    simulatedPrice,
    reactionTimeMs,
    notes,
  } = req.body;

  // Validate session belongs to user
  const { data: session, error: sessErr } = await supabase
    .from('simulation_sessions')
    .select('id, scenario, current_step')
    .eq('id', sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (sessErr || !session) {
    return res.status(404).json({ success: false, message: 'Simulation session not found' });
  }

  // Auto-detect panic: sell during crash or volatility
  const isPanic =
    decisionType === 'sell' &&
    (session.scenario === 'MarketCrash' || session.scenario === 'VolatilitySpike');

  const { data: log, error: logErr } = await supabase
    .from('behavior_logs')
    .insert({
      user_id: req.user.id,
      session_id: sessionId,
      decision_type: decisionType,
      symbol,
      price_at_decision: priceAtDecision,
      simulated_price: simulatedPrice,
      scenario_type: session.scenario,
      simulation_step: session.current_step,
      reaction_time_ms: reactionTimeMs,
      is_panic_decision: isPanic,
      notes,
    })
    .select()
    .single();

  if (logErr) return res.status(500).json({ success: false, message: logErr.message });

  // Adjust fear score  
  const delta = behaviorService.fearScoreDelta({ isPanicDecision: isPanic, decisionType, scenarioType: session.scenario });

  let fearScoreAdjustment = 0;
  if (delta !== 0) {
    const { data: user } = await supabase
      .from('users')
      .select('fear_score, fear_score_history')
      .eq('id', req.user.id)
      .single();

    const newScore       = Math.min(100, Math.max(0, (user?.fear_score || 50) + delta));
    const updatedHistory = [
      ...(Array.isArray(user?.fear_score_history) ? user.fear_score_history : []),
      { score: newScore, recorded_at: new Date().toISOString() },
    ];

    await supabase
      .from('users')
      .update({
        fear_score: newScore,
        fear_score_history: updatedHistory,
        investor_type: deriveInvestorType(newScore),
      })
      .eq('id', req.user.id);

    fearScoreAdjustment = delta;
  }

  res.status(201).json({
    success: true,
    message: 'Decision logged',
    log: {
      id: log.id,
      decisionType: log.decision_type,
      symbol: log.symbol,
      isPanicDecision: log.is_panic_decision,
      reactionTimeMs: log.reaction_time_ms,
      scenarioType: log.scenario_type,
    },
    fearScoreAdjustment,
  });
};

// ── GET /behavior/report ──────────────────────────────────────────────────────
const getReport = async (req, res) => {
  const report = await behaviorService.analyseUserBehavior(req.user.id);

  res.json({
    success: true,
    userId: req.user.id,
    report,
    interpretation: {
      panicFrequency:
        report.panicFrequency > 60
          ? 'High – You tend to sell in panic. Try holding through dips.'
          : report.panicFrequency > 30
          ? 'Moderate – Some panic behaviour detected. Keep practicing.'
          : 'Low – Great composure!',
      riskAversionScore:
        report.riskAversionScore > 70
          ? 'Very risk-averse – You prefer safety over returns.'
          : report.riskAversionScore > 40
          ? 'Moderately cautious – balanced approach.'
          : 'Risk-tolerant – You embrace volatility.',
    },
  });
};

module.exports = { logDecision, getReport };
