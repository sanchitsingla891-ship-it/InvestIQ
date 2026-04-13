'use strict';

const supabase = require('../config/supabase');

const PANIC_SELL_FEAR_INCREMENT = 5;
const HOLD_FEAR_DECREMENT       = 2;
const FAST_REACTION_MS          = 3000;

// ── Analyse all behavior logs for a user ─────────────────────────────────────
const analyseUserBehavior = async (userId) => {
  const { data: logs, error } = await supabase
    .from('behavior_logs')
    .select('decision_type, is_panic_decision, reaction_time_ms, scenario_type')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error || !logs?.length) {
    return {
      totalDecisions:    0,
      panicSells:        0,
      panicFrequency:    0,
      avgReactionTimeMs: 0,
      decisionBreakdown: { buy: 0, sell: 0, hold: 0 },
      riskAversionScore: 50,
      topScenario:       null,
    };
  }

  const panicLogs      = logs.filter((l) => l.is_panic_decision);
  const totalDecisions = logs.length;
  const panicFrequency = parseFloat(((panicLogs.length / totalDecisions) * 100).toFixed(1));

  // Avg reaction time
  const timedLogs = logs.filter((l) => l.reaction_time_ms != null);
  const avgReactionTimeMs = timedLogs.length > 0
    ? Math.round(timedLogs.reduce((s, l) => s + l.reaction_time_ms, 0) / timedLogs.length)
    : 0;

  // Decision breakdown
  const decisionBreakdown = logs.reduce(
    (acc, l) => { acc[l.decision_type] = (acc[l.decision_type] || 0) + 1; return acc; },
    { buy: 0, sell: 0, hold: 0 }
  );

  // Risk aversion score
  const sellRatio         = decisionBreakdown.sell / totalDecisions;
  const holdRatio         = decisionBreakdown.hold / totalDecisions;
  const riskAversionScore = Math.min(
    100,
    Math.round(sellRatio * 60 + holdRatio * 10 + panicFrequency * 0.3)
  );

  // Most common scenario
  const scenarioCounts = logs.reduce((acc, l) => {
    if (l.scenario_type) acc[l.scenario_type] = (acc[l.scenario_type] || 0) + 1;
    return acc;
  }, {});
  const topScenario = Object.keys(scenarioCounts)
    .sort((a, b) => scenarioCounts[b] - scenarioCounts[a])[0] || null;

  // Impulsive decisions
  const impulsiveCount = timedLogs.filter(
    (l) => l.reaction_time_ms < FAST_REACTION_MS && l.decision_type === 'sell'
  ).length;

  return {
    totalDecisions,
    panicSells:        panicLogs.length,
    panicFrequency,
    avgReactionTimeMs,
    impulsiveDecisions: impulsiveCount,
    decisionBreakdown,
    riskAversionScore,
    topScenario,
  };
};

// ── Fear score delta for a single decision ────────────────────────────────────
const fearScoreDelta = ({ isPanicDecision, decisionType, scenarioType }) => {
  if (isPanicDecision) return PANIC_SELL_FEAR_INCREMENT;
  if (decisionType === 'hold' && scenarioType === 'MarketCrash') return -HOLD_FEAR_DECREMENT;
  return 0;
};

module.exports = { analyseUserBehavior, fearScoreDelta };
