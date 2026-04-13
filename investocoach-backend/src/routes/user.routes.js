'use strict';

const express = require('express');
const { body } = require('express-validator');
const { getProfile, updateProfile } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// All user routes require authentication
router.use(protect);

// GET /user/profile
router.get('/profile', getProfile);

// PATCH /user/profile
router.patch(
  '/profile',
  [
    body('name').optional().trim().isLength({ max: 60 }),
    body('riskPreference')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('riskPreference must be low | medium | high'),
  ],
  validate,
  updateProfile
);

module.exports = router;
