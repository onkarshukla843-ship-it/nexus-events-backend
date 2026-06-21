const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { createCheckoutSession,onboardHost } = require('../controllers/paymentController');

// Route: POST /api/v1/payments/create-checkout-session
router.post('/create-checkout-session', protect, createCheckoutSession);

// Route: POST /api/v1/payments/onboard-host
router.post('/onboard-host', protect, onboardHost);

module.exports = router;