const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/appointmentController');

// Doctor search
router.get('/search-doctors', ctrl.searchDoctors);

// Booked slots for a doctor
router.get('/available-slots/:doctorId', ctrl.getBookedSlots);

// Doctor stats dashboard
router.get('/stats/doctor/:doctorId', ctrl.getDoctorStats);

// Patient's appointments
router.get('/patient/:patientId', ctrl.getPatientAppointments);

// Doctor's appointments
router.get('/doctor/:doctorId', ctrl.getDoctorAppointments);

// Single appointment
router.get('/:id', ctrl.getAppointment);

// Book a new appointment
router.post('/', ctrl.createAppointment);

// Doctor accepts/rejects; patient modifies status
router.put('/:id/status', ctrl.updateStatus);

// Payment service callback – update payment status
router.put('/:id/payment', ctrl.updatePaymentStatus);

// Cancel appointment
router.delete('/:id', ctrl.cancelAppointment);

module.exports = router;
