'use strict';

const express = require('express');
const { body } = require('express-validator');
const { signup, login } = require('../controllers/auth.controller');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /auth/signup
router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('riskPreference')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('riskPreference must be low | medium | high'),
  ],
  validate,
  signup
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

module.exports = router;
