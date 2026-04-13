'use strict';

const supabase = require('../config/supabase');
const behaviorService = require('../services/behavior.service');
const recommendationService = require('../services/recommendation.service');
const geminiService = require('../services/gemini.service');

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

// ── GET /recommendations/fear-question ────────────────────────────────────────
const generateFearQuestion = async (req, res) => {
  const { biasTarget, previousQuestions } = req.body;
  if (!biasTarget) {
    return res.status(400).json({ success: false, message: 'biasTarget is required.' });
  }

  const questionText = await geminiService.generateFearQuestion(biasTarget, previousQuestions);
  res.json({ success: true, text: questionText });
};

// ── POST /recommendations/debrief ─────────────────────────────────────────────
const generateDebrief = async (req, res) => {
  const sessionData = req.body;
  const debriefText = await geminiService.generateDebrief(sessionData);
  res.json({ success: true, text: debriefText });
};

// ── POST /recommendations/coach-chat ──────────────────────────────────────────
const coachChat = async (req, res) => {
  const { userMessage, context } = req.body;
  const aiResponse = await geminiService.coachChat(userMessage, context);
  res.json({ success: true, text: aiResponse });
};

// ── POST /recommendations/analyze-claim ───────────────────────────────────────
const analyzeClaim = async (req, res) => {
  const { claimText } = req.body;
  if (!claimText) {
    return res.status(400).json({ success: false, message: 'claimText is required.' });
  }

  const analysis = await geminiService.analyzeClaim(claimText);
  res.json({ success: true, result: analysis });
};

module.exports = {
  getRecommendations,
  generateFearQuestion,
  generateDebrief,
  coachChat,
  analyzeClaim
};
