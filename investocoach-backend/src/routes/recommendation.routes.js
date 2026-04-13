'use strict';

const express = require('express');
const { getRecommendations } = require('../controllers/recommendation.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /recommendations
router.get('/', getRecommendations);

module.exports = router;
