'use strict';

const supabase = require('../config/supabase');
const simService = require('../services/simulation.service');
const behaviorService = require('../services/behavior.service');

// ── POST /simulation/start ────────────────────────────────────────────────────
const startSimulation = async (req, res) => {
  const { scenario = 'Neutral', symbols = ['AAPL', 'TSLA'] } = req.body;

  const config = simService.getScenarioConfig(scenario);
  if (!config) {
    return res.status(400).json({ success: false, message: `Unknown scenario: ${scenario}` });
  }

  // Abandon any active sessions for this user
  await supabase
    .from('simulation_sessions')
    .update({ status: 'abandoned' })
    .eq('user_id', req.user.id)
    .eq('status', 'active');

  // Build first price tick
  const ticks = await simService.buildStepTicks(symbols, scenario, 0);

  // Create session
  const { data: session, error } = await supabase
    .from('simulation_sessions')
    .insert({
      user_id: req.user.id,
      scenario,
      symbols,
      scenario_config: {
        multiplierMin: config.multiplierMin,
        multiplierMax: config.multiplierMax,
        durationSteps: config.durationSteps,
      },
      current_step: 1,
      price_history: ticks.map((t) => ({ ...t, timestamp: new Date().toISOString() })),
    })
    .select()
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  res.status(201).json({
    success: true,
    message: `Simulation started – ${config.description}`,
    session: {
      id: session.id,
      scenario,
      symbols,
      step: session.current_step,
      totalSteps: config.durationSteps,
      currentPrices: ticks,
      description: config.description,
    },
  });
};

// ── POST /simulation/step ─────────────────────────────────────────────────────
const stepSimulation = async (req, res) => {
  const { sessionId } = req.body;

  const { data: session, error: fetchErr } = await supabase
    .from('simulation_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', req.user.id)
    .single();

  if (fetchErr || !session) {
    return res.status(404).json({ success: false, message: 'Session not found' });
  }
  if (session.status !== 'active') {
    return res.status(400).json({ success: false, message: `Session is ${session.status}` });
  }

  const config = simService.getScenarioConfig(session.scenario);
  const ticks  = await simService.buildStepTicks(session.symbols, session.scenario, session.current_step);

  const updatedHistory = [
    ...session.price_history,
    ...ticks.map((t) => ({ ...t, timestamp: new Date().toISOString() })),
  ];

  const newStep    = session.current_step + 1;
  const isComplete = newStep >= config.durationSteps;

  // Compute panic score if finishing
  let panicScore = session.panic_score;
  if (isComplete) {
    const { data: logs } = await supabase
      .from('behavior_logs')
      .select('is_panic_decision')
      .eq('session_id', sessionId);
    panicScore = simService.computePanicScore(logs || []);
  }

  const updates = {
    current_step:  newStep,
    price_history: updatedHistory,
    panic_score:   panicScore,
    ...(isComplete && { status: 'completed', completed_at: new Date().toISOString() }),
  };

  await supabase.from('simulation_sessions').update(updates).eq('id', sessionId);

  // Increment simulations_completed on user
  if (isComplete) {
    const { data: u } = await supabase
      .from('users')
      .select('simulations_completed')
      .eq('id', req.user.id)
      .single();

    await supabase
      .from('users')
      .update({ simulations_completed: (u?.simulations_completed || 0) + 1 })
      .eq('id', req.user.id);
  }

  res.json({
    success: true,
    step: newStep,
    totalSteps: config.durationSteps,
    isComplete,
    currentPrices: ticks,
    ...(isComplete && {
      summary: {
        panicScore,
        message: panicScore > 50
          ? '⚠️ High panic behaviour detected. Practice holding during dips!'
          : '✅ Great composure! You managed fear well.',
      },
    }),
  });
};

// ── GET /simulation/status ────────────────────────────────────────────────────
const getStatus = async (req, res) => {
  let query = supabase
    .from('simulation_sessions')
    .select('id, scenario, status, current_step, scenario_config, symbols, panic_score, started_at, completed_at')
    .eq('user_id', req.user.id);

  if (req.query.sessionId) {
    query = query.eq('id', req.query.sessionId);
  } else {
    query = query.eq('status', 'active');
  }

  const { data: session, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();

  if (error || !session) {
    return res.status(404).json({ success: false, message: 'No active simulation found' });
  }

  res.json({
    success: true,
    session: {
      id: session.id,
      scenario: session.scenario,
      status: session.status,
      currentStep: session.current_step,
      totalSteps: session.scenario_config?.durationSteps,
      symbols: session.symbols,
      panicScore: session.panic_score,
      startedAt: session.started_at,
      completedAt: session.completed_at,
    },
  });
};

module.exports = { startSimulation, stepSimulation, getStatus };
