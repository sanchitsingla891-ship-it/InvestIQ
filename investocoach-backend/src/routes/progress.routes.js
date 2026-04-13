'use strict';

const express = require('express');
const { getProgress } = require('../controllers/progress.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// GET /progress
router.get('/', getProgress);

module.exports = router;
