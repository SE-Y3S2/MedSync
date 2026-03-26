const Appointment = require('../models/Appointment');
const axios = require('axios');

const DOCTOR_SERVICE_URL =
    process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';

// Doctor Search 
exports.searchDoctors = async (req, res) => {
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

// Book Appointment 
exports.createAppointment = async (req, res) => {
    try {
        const {
            patientId,
            patientName,
            patientEmail,
            doctorId,
            doctorName,
            specialty,
            slotDate,
            slotTime,
            reason,
            consultationFee,
        } = req.body;

        // Prevent double-booking the same slot
        const conflict = await Appointment.findOne({
            doctorId,
            slotDate,
            slotTime,
            status: { $in: ['pending', 'confirmed'] },
        });
        if (conflict) {
            return res.status(409).json({ message: 'This slot is already booked.' });
        }

        const appointment = new Appointment({
            patientId,
            patientName,
            patientEmail,
            doctorId,
            doctorName,
            specialty,
            slotDate,
            slotTime,
            reason,
            consultationFee,
        });
        await appointment.save();
        res.status(201).json(appointment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Get Single Appointment 
exports.getAppointment = async (req, res) => {
    try {
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        res.json(appointment);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Patient's Appointments 
exports.getPatientAppointments = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = { patientId: req.params.patientId };
        if (status) filter.status = status;
        const appointments = await Appointment.find(filter).sort({ slotDate: 1, slotTime: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Doctor's Appointments 
exports.getDoctorAppointments = async (req, res) => {
    try {
        const { status, date } = req.query;
        const filter = { doctorId: req.params.doctorId };
        if (status) filter.status = status;
        if (date) filter.slotDate = date;
        const appointments = await Appointment.find(filter).sort({ slotDate: 1, slotTime: 1 });
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Update Appointment Status 
exports.updateStatus = async (req, res) => {
    try {
        const { status, cancelledBy, cancellationReason, notes } = req.body;

        const allowed = ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: `Invalid status. Must be one of: ${allowed.join(', ')}` });
        }

        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        // Guard: can only cancel a pending/confirmed appointment
        if (status === 'cancelled' && !['pending', 'confirmed'].includes(appointment.status)) {
            return res.status(400).json({ message: 'Cannot cancel an appointment that is not pending or confirmed.' });
        }

        appointment.status = status;
        if (cancelledBy) appointment.cancelledBy = cancelledBy;
        if (cancellationReason) appointment.cancellationReason = cancellationReason;
        if (notes) appointment.notes = notes;

        await appointment.save();
        res.json(appointment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update Payment Status 
exports.updatePaymentStatus = async (req, res) => {
    try {
        const { paymentStatus, paymentId } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

        appointment.paymentStatus = paymentStatus;
        if (paymentId) appointment.paymentId = paymentId;

        // Auto-confirm once paid
        if (paymentStatus === 'paid' && appointment.status === 'pending') {
            appointment.status = 'confirmed';
        }

        await appointment.save();
        res.json(appointment);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Cancel Appointment 
exports.cancelAppointment = async (req, res) => {
    try {
        const { cancelledBy, cancellationReason } = req.body;
        const appointment = await Appointment.findById(req.params.id);
        if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
        if (!['pending', 'confirmed'].includes(appointment.status)) {
            return res.status(400).json({ message: 'Only pending or confirmed appointments can be cancelled.' });
        }

        appointment.status = 'cancelled';
        appointment.cancelledBy = cancelledBy || 'patient';
        if (cancellationReason) appointment.cancellationReason = cancellationReason;
        await appointment.save();
        res.json({ message: 'Appointment cancelled successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get Available Slots for a Doctor 
exports.getBookedSlots = async (req, res) => {
    try {
        const { date } = req.query;
        const filter = {
            doctorId: req.params.doctorId,
            status: { $in: ['pending', 'confirmed'] },
        };
        if (date) filter.slotDate = date;

        const booked = await Appointment.find(filter, 'slotDate slotTime -_id');
        res.json(booked);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Stats (dashboard summary)    
exports.getDoctorStats = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const [total, pending, confirmed, completed, cancelled] = await Promise.all([
            Appointment.countDocuments({ doctorId }),
            Appointment.countDocuments({ doctorId, status: 'pending' }),
            Appointment.countDocuments({ doctorId, status: 'confirmed' }),
            Appointment.countDocuments({ doctorId, status: 'completed' }),
            Appointment.countDocuments({ doctorId, status: 'cancelled' }),
        ]);
        res.json({ total, pending, confirmed, completed, cancelled });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
