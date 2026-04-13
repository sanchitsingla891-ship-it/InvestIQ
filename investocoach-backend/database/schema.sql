-- ──────────────────────────────────────────────────────────────────────────────
-- InvestoCoach – Supabase / PostgreSQL Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ──────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension (available by default on Supabase)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── 1. USERS ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                 VARCHAR(60)  NOT NULL,
  email                VARCHAR(255) NOT NULL UNIQUE,
  password_hash        TEXT         NOT NULL,
  fear_score           INTEGER      NOT NULL DEFAULT 50 CHECK (fear_score BETWEEN 0 AND 100),
  investor_type        VARCHAR(20)  NOT NULL DEFAULT 'Beginner'
                         CHECK (investor_type IN ('Beginner','Cautious','Overthinker','Balanced','Aggressive')),
  risk_preference      VARCHAR(10)  NOT NULL DEFAULT 'low'
                         CHECK (risk_preference IN ('low','medium','high')),
  simulations_completed INTEGER     NOT NULL DEFAULT 0,
  fear_score_history   JSONB        NOT NULL DEFAULT '[]',
  is_active            BOOLEAN      NOT NULL DEFAULT TRUE,
  created_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- ── 2. SIMULATION SESSIONS ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS simulation_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario         VARCHAR(20) NOT NULL
                     CHECK (scenario IN ('MarketCrash','BullRun','VolatilitySpike','Neutral')),
  status           VARCHAR(20) NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active','completed','abandoned')),
  symbols          JSONB       NOT NULL DEFAULT '[]',
  scenario_config  JSONB       NOT NULL DEFAULT '{}',
  current_step     INTEGER     NOT NULL DEFAULT 0,
  price_history    JSONB       NOT NULL DEFAULT '[]',
  panic_score      INTEGER     NOT NULL DEFAULT 0,
  performance_score NUMERIC    NOT NULL DEFAULT 0,
  started_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sim_sessions_user_id ON simulation_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sim_sessions_status  ON simulation_sessions (status);

-- ── 3. BEHAVIOR LOGS ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS behavior_logs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id         UUID        NOT NULL REFERENCES simulation_sessions(id) ON DELETE CASCADE,
  decision_type      VARCHAR(10) NOT NULL CHECK (decision_type IN ('buy','sell','hold')),
  symbol             VARCHAR(20) NOT NULL,
  price_at_decision  NUMERIC     NOT NULL,
  simulated_price    NUMERIC,
  scenario_type      VARCHAR(20),
  simulation_step    INTEGER,
  reaction_time_ms   INTEGER     CHECK (reaction_time_ms >= 0),
  is_panic_decision  BOOLEAN     NOT NULL DEFAULT FALSE,
  notes              TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_id    ON behavior_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_behavior_logs_session_id ON behavior_logs (session_id);

-- ── 4. PORTFOLIOS ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS portfolios (
  id            UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID    NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  cash_balance  NUMERIC NOT NULL DEFAULT 10000,
  holdings      JSONB   NOT NULL DEFAULT '[]',
  transactions  JSONB   NOT NULL DEFAULT '[]',
  realised_pnl  NUMERIC NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── 5. MARKET CACHE ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS market_cache (
  id              UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  symbol          VARCHAR(20) NOT NULL UNIQUE,
  price           NUMERIC     NOT NULL,
  change_percent  NUMERIC     DEFAULT 0,
  high            NUMERIC,
  low             NUMERIC,
  open_price      NUMERIC,
  previous_close  NUMERIC,
  source          VARCHAR(50) DEFAULT 'finnhub',
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Auto-update updated_at via trigger ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_sessions_updated_at
  BEFORE UPDATE ON simulation_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── Disable RLS (backend manages its own auth via service_role key) ────────────
ALTER TABLE users               DISABLE ROW LEVEL SECURITY;
ALTER TABLE simulation_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_logs       DISABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios          DISABLE ROW LEVEL SECURITY;
ALTER TABLE market_cache        DISABLE ROW LEVEL SECURITY;
