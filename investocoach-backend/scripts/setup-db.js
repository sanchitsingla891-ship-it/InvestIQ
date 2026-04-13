'use strict';

/**
 * InvestoCoach – Supabase Setup Validator
 * 
 * Run this AFTER:
 *   1. Creating your Supabase project
 *   2. Adding SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env
 *   3. Running database/schema.sql in the Supabase SQL editor
 * 
 * Usage:
 *   node scripts/setup-db.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const REQUIRED_TABLES = [
  'users',
  'simulation_sessions',
  'behavior_logs',
  'portfolios',
  'market_cache',
];

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

const ok = (msg) => console.log(`${COLORS.green}  ✅ ${msg}${COLORS.reset}`);
const fail = (msg) => console.log(`${COLORS.red}  ❌ ${msg}${COLORS.reset}`);
const info = (msg) => console.log(`${COLORS.cyan}  ℹ  ${msg}${COLORS.reset}`);
const warn = (msg) => console.log(`${COLORS.yellow}  ⚠  ${msg}${COLORS.reset}`);

async function run() {
  console.log(`\n${COLORS.bold}${COLORS.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  InvestoCoach – Supabase Setup Validator`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);

  // ── Step 1: Check env vars ──────────────────────────────────────────────────
  console.log(`${COLORS.bold}[1] Checking environment variables...${COLORS.reset}`);
  let envOk = true;

  if (!process.env.SUPABASE_URL || process.env.SUPABASE_URL.includes('your-project')) {
    fail('SUPABASE_URL is not set in .env');
    envOk = false;
  } else {
    ok(`SUPABASE_URL = ${process.env.SUPABASE_URL}`);
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service')) {
    fail('SUPABASE_SERVICE_ROLE_KEY is not set in .env');
    envOk = false;
  } else {
    ok('SUPABASE_SERVICE_ROLE_KEY is set');
  }

  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your_super_secret')) {
    warn('JWT_SECRET is using default value – change it for production!');
  } else {
    ok('JWT_SECRET is set');
  }

  if (!envOk) {
    console.log(`\n${COLORS.red}${COLORS.bold}Setup failed – fix the environment variables above, then re-run.${COLORS.reset}`);
    console.log(`\n  Edit: ${COLORS.cyan}d:\\InvestIQ_Project\\investocoach-backend\\.env${COLORS.reset}\n`);
    process.exit(1);
  }

  // ── Step 2: Connect to Supabase ─────────────────────────────────────────────
  console.log(`\n${COLORS.bold}[2] Connecting to Supabase...${COLORS.reset}`);
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // ── Step 3: Check each table ────────────────────────────────────────────────
  console.log(`\n${COLORS.bold}[3] Checking required tables...${COLORS.reset}`);
  let allTablesOk = true;

  for (const table of REQUIRED_TABLES) {
    try {
      const { error } = await supabase.from(table).select('*').limit(1);
      if (error) {
        fail(`Table "${table}" – ${error.message}`);
        allTablesOk = false;
      } else {
        ok(`Table "${table}" exists`);
      }
    } catch (e) {
      fail(`Table "${table}" – ${e.message}`);
      allTablesOk = false;
    }
  }

  if (!allTablesOk) {
    console.log(`\n${COLORS.yellow}${COLORS.bold}Some tables are missing!${COLORS.reset}`);
    console.log(`\n  Run the SQL schema in your Supabase SQL Editor:`);
    console.log(`  ${COLORS.cyan}d:\\InvestIQ_Project\\investocoach-backend\\database\\schema.sql${COLORS.reset}\n`);
    console.log(`  Supabase Dashboard → SQL Editor → New query → paste schema → Run\n`);
    process.exit(1);
  }

  // ── Step 4: Insert + delete test row ───────────────────────────────────────
  console.log(`\n${COLORS.bold}[4] Testing read/write access...${COLORS.reset}`);
  const testEmail = `_setup_test_${Date.now()}@investocoach.test`;

  const { data: inserted, error: insertErr } = await supabase
    .from('users')
    .insert({
      name: '__setup_test__',
      email: testEmail,
      password_hash: '__test__',
    })
    .select('id')
    .single();

  if (insertErr) {
    fail(`Write test failed: ${insertErr.message}`);
    process.exit(1);
  }

  ok('Write test passed');

  // Cleanup
  await supabase.from('users').delete().eq('id', inserted.id);
  ok('Cleanup passed');

  // ── Step 5: Check Finnhub key ───────────────────────────────────────────────
  console.log(`\n${COLORS.bold}[5] Checking optional services...${COLORS.reset}`);
  if (!process.env.FINNHUB_API_KEY || process.env.FINNHUB_API_KEY.includes('your_finnhub')) {
    warn('FINNHUB_API_KEY not set – GET /market/price will fail. Get a free key at https://finnhub.io');
  } else {
    ok('FINNHUB_API_KEY is set');
  }

  // ── Done ────────────────────────────────────────────────────────────────────
  console.log(`\n${COLORS.green}${COLORS.bold}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  ✅  All checks passed! Supabase is fully integrated.`);
  console.log(`  🚀  Start the server with: npm run dev`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.reset}\n`);
}

run().catch((err) => {
  console.error(`\n${COLORS.red}Unexpected error: ${err.message}${COLORS.reset}\n`);
  process.exit(1);
});
