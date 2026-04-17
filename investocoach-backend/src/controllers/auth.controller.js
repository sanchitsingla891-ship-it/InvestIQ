'use strict';

const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const supabase = require('../config/supabase');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// ── Helper: derive investor type from fear score ───────────────────────────────
const deriveInvestorType = (score) => {
  if (score >= 80) return 'Cautious';
  if (score >= 60) return 'Overthinker';
  if (score >= 40) return 'Balanced';
  if (score >= 20) return 'Beginner';
  return 'Aggressive';
};

// ── POST /auth/signup ─────────────────────────────────────────────────────────
const signup = async (req, res) => {
  const { name, email, password, riskPreference = 'low' } = req.body;

  // Check duplicate email
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (existing) {
    return res.status(409).json({ success: false, message: 'Email already in use' });
  }

  const salt         = await bcrypt.genSalt(12);
  const passwordHash = await bcrypt.hash(password, salt);

  // Insert user
  const { data: user, error } = await supabase
    .from('users')
    .insert({
      name,
      email,
      password_hash: passwordHash,
      risk_preference: riskPreference,
      investor_type: 'Beginner',
      fear_score: 50,
    })
    .select('id, name, email, fear_score, investor_type, risk_preference')
    .single();

  if (error) {
    return res.status(500).json({ success: false, message: error.message });
  }

  // Bootstrap sandbox portfolio
  await supabase.from('portfolios').insert({
    user_id: user.id,
    cash_balance: Number(process.env.DEFAULT_PORTFOLIO_AMOUNT) || 10000,
  });

  const token = signToken(user.id);

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user,
  });
};

// ── POST /auth/login ──────────────────────────────────────────────────────────
const login = async (req, res) => {
  const { email, password } = req.body;

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, password_hash, fear_score, investor_type, risk_preference, is_active')
    .eq('email', email)
    .maybeSingle();

  if (error || !user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  if (!user.is_active) {
    return res.status(401).json({ success: false, message: 'Account deactivated' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }

  const token = signToken(user.id);

  // eslint-disable-next-line no-unused-vars
  const { password_hash, ...safeUser } = user;

  res.json({ success: true, message: 'Login successful', token, user: safeUser });
};

const googleAuth = async (req, res) => {
  const { credential } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    // Check if user exists by email
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, name, email, fear_score, investor_type, risk_preference, is_active')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      if (!existingUser.is_active) {
        return res.status(401).json({ success: false, message: 'Account deactivated' });
      }
      const token = signToken(existingUser.id);
      return res.json({ success: true, message: 'Login successful', token, user: existingUser });
    }

    // Insert new user
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(Math.random().toString(36), salt);

    const { data: user, error } = await supabase
      .from('users')
      .insert({
        name,
        email,
        password_hash: passwordHash,
        risk_preference: 'low',
        investor_type: 'Beginner',
        fear_score: 50,
      })
      .select('id, name, email, fear_score, investor_type, risk_preference')
      .single();

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    // Bootstrap sandbox portfolio
    await supabase.from('portfolios').insert({
      user_id: user.id,
      cash_balance: Number(process.env.DEFAULT_PORTFOLIO_AMOUNT) || 100000,
    });

    const token = signToken(user.id);
    return res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user,
    });
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
};

module.exports = { signup, login, googleAuth, deriveInvestorType };
