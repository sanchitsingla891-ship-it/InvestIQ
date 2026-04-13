'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getPortfolio, buyAsset, sellAsset } = require('../controllers/portfolio.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

router.use(protect);

// GET /portfolio
router.get('/', getPortfolio);

// POST /portfolio/buy
router.post(
  '/buy',
  [
    body('symbol').notEmpty().withMessage('symbol is required').toUpperCase(),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
  ],
  validate,
  buyAsset
);

// POST /portfolio/sell
router.post(
  '/sell',
  [
    body('symbol').notEmpty().withMessage('symbol is required').toUpperCase(),
    body('quantity').isInt({ min: 1 }).withMessage('quantity must be a positive integer'),
  ],
  validate,
  sellAsset
);

module.exports = router;
