// js/state.js — Central state store for InvestIQ

const STATE = {
  lang: 'english',
  fearProfile: null,
  biasScores: {
    loss_aversion: 0,
    recency_bias: 0,
    herd_mentality: 0,
    overconfidence: 0,
    anchoring: 0
  },
  disciplineScore: 60,
  simulationsDone: 0,
  crashesSurvived: 0,
  // Sandbox
  sandboxPortfolio: 100000,
  sandboxCash: 100000,
  sandboxHoldings: {},
  sandboxRunning: false,
  checkpointsShown: { 10: false, 20: false, 30: false },
  userDecisions: [],
  // Crash replay
  crashReplayed: [],
  crashDecisions: [],
  selectedCrash: null,
  // Milestones
  milestones: {
    held_20pct_drop: false,
    survived_crash: false,
    completed_two_sims: false
  }
};
