'use strict';

const express = require('express');
const { getPrice, getTrending, getSandboxPrices } = require('../controllers/market.controller');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public endpoint — sandbox needs prices before auth
router.get('/sandbox-prices', getSandboxPrices);

// Authenticated endpoints
router.use(protect);
router.get('/price', getPrice);
router.get('/trending', getTrending);

module.exports = router;
