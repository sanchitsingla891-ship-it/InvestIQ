'use strict';

const express = require('express');
const { body } = require('express-validator');
const { startSimulation, stepSimulation, getStatus } = require('../controllers/simulation.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// POST /simulation/start
router.post(
  '/start',
  [
    body('scenario')
      .optional()
      .isIn(['MarketCrash', 'BullRun', 'VolatilitySpike', 'Neutral'])
      .withMessage('scenario must be MarketCrash | BullRun | VolatilitySpike | Neutral'),
    body('symbols')
      .optional()
      .isArray({ min: 1, max: 5 })
      .withMessage('symbols must be an array of 1–5 items'),
  ],
  validate,
  startSimulation
);

// POST /simulation/step
router.post(
  '/step',
  [body('sessionId').notEmpty().withMessage('sessionId is required')],
  validate,
  stepSimulation
);

// GET /simulation/status?sessionId=xxx
router.get('/status', getStatus);

module.exports = router;
