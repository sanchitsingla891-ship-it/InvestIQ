'use strict';

const express = require('express');
const { body } = require('express-validator');
const { logDecision, getReport } = require('../controllers/behavior.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// POST /behavior/log
router.post(
  '/log',
  [
    body('sessionId').notEmpty().withMessage('sessionId is required'),
    body('decisionType')
      .isIn(['buy', 'sell', 'hold'])
      .withMessage('decisionType must be buy | sell | hold'),
    body('symbol').notEmpty().withMessage('symbol is required'),
    body('priceAtDecision').isFloat({ min: 0 }).withMessage('priceAtDecision must be a positive number'),
    body('reactionTimeMs')
      .optional()
      .isInt({ min: 0 })
      .withMessage('reactionTimeMs must be a non-negative integer'),
  ],
  validate,
  logDecision
);

// GET /behavior/report
router.get('/report', getReport);

module.exports = router;
