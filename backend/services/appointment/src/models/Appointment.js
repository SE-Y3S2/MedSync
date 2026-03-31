const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        patientId: { type: String, required: true, index: true },
        patientName: { type: String, required: true },
        patientEmail: { type: String, required: true },

        doctorId: { type: String, required: true, index: true },
        doctorName: { type: String, required: true },
        specialty: { type: String },

        slotDate: { type: String, required: true },
        slotTime: { type: String, required: true },
        reason: { type: String, required: true },
        consultationFee: { type: Number, required: true },

        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
            default: 'pending'
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid'
        },
        paymentId: { type: String },

        cancelledBy: { type: String },
        cancellationReason: { type: String },
        notes: { type: String }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
