'use strict';

const express = require('express');
const { 
  getRecommendations, 
  generateFearQuestion, 
  generateDebrief, 
  coachChat, 
  analyzeClaim 
} = require('../controllers/recommendation.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /recommendations
router.get('/', getRecommendations);

// POST /recommendations/fear-question
router.post('/fear-question', generateFearQuestion);

// POST /recommendations/debrief
router.post('/debrief', generateDebrief);

// POST /recommendations/coach-chat
router.post('/coach-chat', coachChat);

// POST /recommendations/analyze-claim
router.post('/analyze-claim', analyzeClaim);

module.exports = router;
