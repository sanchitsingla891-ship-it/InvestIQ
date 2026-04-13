'use strict';

const express = require('express');
const { getPrice, getTrending } = require('../controllers/market.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Market routes require auth so only registered users can pull live data
router.use(protect);

// GET /market/price?symbol=AAPL
router.get('/price', getPrice);

// GET /market/trending
router.get('/trending', getTrending);

module.exports = router;
