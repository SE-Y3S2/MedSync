const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const { createCheckoutRules } = require('../middleware/validate');

// ── Stripe Webhook ─────────────────────────────────────────────────────────
// IMPORTANT: must use raw body — declared in app.js before json middleware
router.post('/webhook', ctrl.handleWebhook);

// ── Protected Routes ───────────────────────────────────────────────────────
// Create a Stripe Checkout session for an appointment
router.post('/checkout', auth, createCheckoutRules, ctrl.createCheckoutSession);

// Payment history for a patient
router.get('/patient/:id', auth, ctrl.getPatientPaymentHistory);

// Payment details for a specific appointment
router.get('/:appointmentId', auth, ctrl.getPaymentByAppointment);

// Admin: Get all system payments
router.get('/', auth, ctrl.getAllPayments);

module.exports = router;
