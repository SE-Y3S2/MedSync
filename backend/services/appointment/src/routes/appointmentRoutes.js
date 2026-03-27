const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointmentController');
const auth = require('../middleware/auth');
const { createAppointmentRules, updateStatusRules } = require('../middleware/validate');

// ── Public / Internal ────────────────────────────────────────────────────────

// Doctor search (proxy to doctor-management service)
router.get('/search-doctors', ctrl.searchDoctors);

// Booked slots for a doctor (used by booking calendar)
router.get('/available-slots/:doctorId', ctrl.getBookedSlots);

// ── Protected ────────────────────────────────────────────────────────────────

// Patient's appointments
router.get('/patient/:patientId', auth, ctrl.getPatientAppointments);

// Doctor's appointments
router.get('/doctor/:doctorId', auth, ctrl.getDoctorAppointments);

// Doctor dashboard stats
router.get('/stats/doctor/:doctorId', auth, ctrl.getDoctorStats);

// Single appointment
router.get('/:id', auth, ctrl.getAppointment);

// Book a new appointment (with validation)
router.post('/', auth, createAppointmentRules, ctrl.createAppointment);

// Doctor accepts/rejects; patient updates status (with validation)
router.put('/:id/status', auth, updateStatusRules, ctrl.updateStatus);

// ── Internal Service Call (no JWT — payment service calls this) ───────────────
// NOTE: If you want to secure this in production, use a shared service secret header.
router.put('/:id/payment', ctrl.updatePaymentStatus);

// Cancel appointment
router.delete('/:id', auth, ctrl.cancelAppointment);

module.exports = router;
