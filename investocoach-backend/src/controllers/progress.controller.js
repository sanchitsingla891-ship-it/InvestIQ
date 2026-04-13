'use strict';

const supabase = require('../config/supabase');
const behaviorService = require('../services/behavior.service');

// ── GET /progress ─────────────────────────────────────────────────────────────
const getProgress = async (req, res) => {
  const userId = req.user.id;

  const [
    { data: user },
    { data: sessions },
    { data: recentLogs },
  ] = await Promise.all([
    supabase
      .from('users')
      .select('fear_score, fear_score_history, investor_type, simulations_completed')
      .eq('id', userId)
      .single(),
    supabase
      .from('simulation_sessions')
      .select('id, scenario, status, panic_score, performance_score, started_at, completed_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('behavior_logs')
      .select('is_panic_decision')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50),
  ]);

  const history     = Array.isArray(user?.fear_score_history) ? user.fear_score_history : [];
  const initialFear = history.length > 0 ? history[0].score : user?.fear_score ?? 50;
  const latestFear  = user?.fear_score ?? 50;
  const fearImprovement = initialFear - latestFear;

  const completedSessions = (sessions || []).filter((s) => s.status === 'completed');
  const avgPanicScore = completedSessions.length > 0
    ? Math.round(completedSessions.reduce((s, sess) => s + sess.panic_score, 0) / completedSessions.length)
    : null;

  const totalDecisions = (recentLogs || []).length;
  const panicDecisions = (recentLogs || []).filter((l) => l.is_panic_decision).length;
  const panicTrend     = totalDecisions > 0
    ? parseFloat(((panicDecisions / totalDecisions) * 100).toFixed(1))
    : 0;

  res.json({
    success: true,
    progress: {
      fearScore: {
        current:     latestFear,
        initial:     initialFear,
        improvement: fearImprovement,
        trend:       fearImprovement > 0 ? 'improving' : fearImprovement < 0 ? 'worsening' : 'stable',
        history:     history.slice(-20),
      },
      simulations: {
        total: user?.simulations_completed ?? 0,
        recentSessions: completedSessions.map((s) => ({
          id: s.id, scenario: s.scenario, panicScore: s.panic_score, completedAt: s.completed_at,
        })),
        avgPanicScore,
      },
      behavior: {
        totalDecisions,
        panicDecisions,
        panicTrend,
        trend: panicTrend < 30 ? '🟢 Excellent' : panicTrend < 60 ? '🟡 Improving' : '🔴 Needs Work',
      },
      investorType: user?.investor_type,
      advice:
        fearImprovement >= 10
          ? "You've significantly reduced your fear! Consider moving to a balanced portfolio."
          : fearImprovement >= 5
          ? 'Good progress! Keep simulating to build confidence.'
          : 'Keep practising. Every simulation makes you a better investor.',
    },
  });
};

module.exports = { getProgress };
