const Appointment = require('../models/Appointment');
const axios = require('axios');

const DOCTOR_SERVICE_URL =
    process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';

// ─── Valid status transitions ───────────────────────────────────────────────
// Maps current status → allowed next statuses
const STATUS_TRANSITIONS = {
    pending: ['confirmed', 'rejected', 'cancelled'],
    confirmed: ['completed', 'cancelled'],
    completed: [],
    rejected: [],
    cancelled: [],
};

// ── Doctor Search ────────────────────────────────────────────────────────────
exports.searchDoctors = async (req, res, next) => {
    try {
        const { specialty } = req.query;
        const url = `${DOCTOR_SERVICE_URL}/api/doctors${specialty ? `?specialty=${encodeURIComponent(specialty)}` : ''
            }`;
        const { data } = await axios.get(url);
        res.json(data);
    } catch (error) {
        res.status(502).json({ message: 'Could not reach doctor service', error: error.message });
    }
};

// ── Doctor Details ────────────────────────────────────────────────────────────
exports.getDoctorDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        const url = `${DOCTOR_SERVICE_URL}/api/doctors/${id}`;
        const { data } = await axios.get(url);
        res.json(data);
    } catch (error) {
        res.status(502).json({ message: 'Could not reach doctor service', error: error.message });
    }
};

// ── Book Appointment ─────────────────────────────────────────────────────────
exports.createAppointment = async (req, res, next) => {
    try {
        const {
            patientId, patientName, patientEmail,
            doctorId, doctorName, specialty,
            slotDate, slotTime, reason, consultationFee,
        } = req.body;

        // Prevent double-booking the same slot
        const conflict = await Appointment.findOne({
            doctorId, slotDate, slotTime,
            status: { $in: ['pending', 'confirmed', 'completed'] },
        });
        if (conflict) {
            return res.status(409).json({ message: 'This slot is already booked.' });
        }

        const appointment = new Appointment({
            patientId, patientName, patientEmail,
            doctorId, doctorName, specialty,
            slotDate, slotTime, reason, consultationFee,
        });
        await appointment.save();
        res.status(201).json(appointment);
    } catch (error) {
        next(error);
    }
};

// ── Get Single Appointment ───────────────────────────────────────────────────
exports.getAppointment = async (req, res, next) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json(appointment);
    } catch (error) {
        next(error);
    }
};

// ── Patient's Appointments (with auto-cancel check) ───────────────────────────
exports.getPatientAppointments = async (req, res, next) => {
    try {
        // Auto-cancel unpaid pending appointments older than 30 mins
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000);
        await Appointment.updateMany(
            {
                patientId: req.params.patientId,
                status: 'pending',
                paymentStatus: 'unpaid',
                createdAt: { $lt: thirtyMinsAgo }
            },
            {
                $set: {
                    status: 'cancelled',
                    cancelledBy: 'system',
                    cancellationReason: 'Payment timeout (30 minutes)'
                }
            }
        );

        const { status } = req.query;
        const filter = { patientId: req.params.patientId };
        if (status) filter.status = status;
        const appointments = await Appointment.find(filter).sort({ slotDate: 1, slotTime: 1 });
        res.json(appointments);
    } catch (error) {
        next(error);
    }
};

// ── Doctor's Appointments ────────────────────────────────────────────────────
exports.getDoctorAppointments = async (req, res, next) => {
    try {
        const { status, date } = req.query;
        const filter = { doctorId: req.params.doctorId };
        if (status) filter.status = status;
        if (date) filter.slotDate = date;
        const appointments = await Appointment.find(filter).sort({ slotDate: 1, slotTime: 1 });
        res.json(appointments);
    } catch (error) {
        next(error);
    }
};

// ── Update Appointment Status ─────────────────────────────────────────────────
exports.updateStatus = async (req, res, next) => {
    try {
        const { status, cancelledBy, cancellationReason, notes } = req.body;

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Enforce lifecycle transitions
        const allowed = STATUS_TRANSITIONS[appointment.status] || [];
        if (!allowed.includes(status)) {
            return res.status(400).json({
                message: `Cannot transition from '${appointment.status}' to '${status}'. Allowed: [${allowed.join(', ') || 'none'}]`,
            });
        }

        appointment.status = status;
        if (cancelledBy) appointment.cancelledBy = cancelledBy;
        if (cancellationReason) appointment.cancellationReason = cancellationReason;
        if (notes) appointment.notes = notes;

        await appointment.save();
        res.json(appointment);
    } catch (error) {
        next(error);
    }
};

// ── Update Payment Status (called by Payment Service) ────────────────────────
exports.updatePaymentStatus = async (req, res, next) => {
    try {
        const { paymentStatus, paymentId } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        const allowed = ['unpaid', 'paid', 'refunded'];
        if (!allowed.includes(paymentStatus)) {
            return res.status(400).json({ message: `Invalid paymentStatus. Must be: ${allowed.join(', ')}` });
        }

        appointment.paymentStatus = paymentStatus;
        if (paymentId) appointment.paymentId = paymentId;

        // Auto-confirm once paid (if still pending)
        if (paymentStatus === 'paid' && appointment.status === 'pending') {
            appointment.status = 'confirmed';
        }

        await appointment.save();
        res.json(appointment);
    } catch (error) {
        next(error);
    }
};

// ── Cancel Appointment ────────────────────────────────────────────────────────
exports.cancelAppointment = async (req, res, next) => {
    try {
        const { cancelledBy, cancellationReason } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        if (!['pending', 'confirmed'].includes(appointment.status)) {
            return res.status(400).json({
                message: 'Only pending or confirmed appointments can be cancelled.',
            });
        }

        appointment.status = 'cancelled';
        appointment.cancelledBy = cancelledBy || 'patient';
        if (cancellationReason) appointment.cancellationReason = cancellationReason;
        await appointment.save();
        res.json({ message: 'Appointment cancelled successfully', appointment });
    } catch (error) {
        next(error);
    }
};

// ── Get Booked Slots for a Doctor ─────────────────────────────────────────────
exports.getBookedSlots = async (req, res, next) => {
    try {
        const { date } = req.query;
        const filter = {
            doctorId: req.params.doctorId,
            status: { $in: ['pending', 'confirmed', 'completed'] },
        };
        if (date) filter.slotDate = date;
        const booked = await Appointment.find(filter, 'slotDate slotTime -_id');
        res.json(booked);
    } catch (error) {
        next(error);
    }
};

// ── Doctor Dashboard Stats ────────────────────────────────────────────────────
exports.getDoctorStats = async (req, res, next) => {
    try {
        const { doctorId } = req.params;
        const [total, pending, confirmed, completed, cancelled] = await Promise.all([
            Appointment.countDocuments({ doctorId }),
            Appointment.countDocuments({ doctorId, status: 'pending' }),
            Appointment.countDocuments({ doctorId, status: 'confirmed' }),
            Appointment.countDocuments({ doctorId, status: 'completed' }),
            Appointment.countDocuments({ doctorId, status: 'cancelled' }),
        ]);
        res.json({ total, pending, confirmed, completed, cancelled });
    } catch (error) {
        next(error);
    }
};
