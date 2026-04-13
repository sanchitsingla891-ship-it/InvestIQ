'use strict';

const supabase = require('../config/supabase');
const behaviorService = require('../services/behavior.service');
const recommendationService = require('../services/recommendation.service');

// ── GET /recommendations ──────────────────────────────────────────────────────
const getRecommendations = async (req, res) => {
  const [{ data: user }, { data: portfolio }, behaviorReport] = await Promise.all([
    supabase
      .from('users')
      .select('id, fear_score, investor_type, risk_preference')
      .eq('id', req.user.id)
      .single(),
    supabase
      .from('portfolios')
      .select('cash_balance')
      .eq('user_id', req.user.id)
      .maybeSingle(),
    behaviorService.analyseUserBehavior(req.user.id),
  ]);

  const enrichedUser = {
    ...user,
    portfolio: { cashBalance: portfolio?.cash_balance ?? 10000 },
  };

  const recommendation = recommendationService.generateRecommendation(
    {
      fearScore: enrichedUser.fear_score,
      investorType: enrichedUser.investor_type,
      riskPreference: enrichedUser.risk_preference,
      portfolio: enrichedUser.portfolio,
    },
    behaviorReport
  );

  res.json({ success: true, ...recommendation });
};

module.exports = { getRecommendations };
