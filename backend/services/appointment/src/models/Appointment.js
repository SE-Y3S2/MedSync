const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
    {
        patientId: { type: String, required: true },
        patientName: { type: String, required: true },
        patientEmail: { type: String },
        doctorId: { type: String, required: true },
        doctorName: { type: String, required: true },
        specialty: { type: String, required: true },
        slotDate: { type: String, required: true },   
        slotTime: { type: String, required: true },   
        reason: { type: String },
        consultationFee: { type: Number, required: true },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'cancelled', 'completed', 'rejected'],
            default: 'pending',
        },
        paymentStatus: {
            type: String,
            enum: ['unpaid', 'paid', 'refunded'],
            default: 'unpaid',
        },
        paymentId: { type: String },
        cancelledBy: { type: String, enum: ['patient', 'doctor', null], default: null },
        cancellationReason: { type: String },
        notes: { type: String },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
