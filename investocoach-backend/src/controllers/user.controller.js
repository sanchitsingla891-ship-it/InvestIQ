'use strict';

const supabase = require('../config/supabase');

// ── GET /user/profile ─────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, fear_score, investor_type, risk_preference, simulations_completed, fear_score_history, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  // Return only the last 10 history entries
  const safeHistory = Array.isArray(user.fear_score_history)
    ? user.fear_score_history.slice(-10)
    : [];

  res.json({
    success: true,
    user: { ...user, fear_score_history: safeHistory },
  });
};

// ── PATCH /user/profile ───────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const updates = {};
  if (req.body.name)           updates.name            = req.body.name;
  if (req.body.riskPreference) updates.risk_preference = req.body.riskPreference;

  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select('name, risk_preference')
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  res.json({ success: true, message: 'Profile updated', user: data });
};

module.exports = { getProfile, updateProfile };
