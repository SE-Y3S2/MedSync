const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  qualifications: [String],
  contact: {
    email: { type: String, required: true, unique: true },
    phone: String,
  },
  bio: String,
  photoUrl: String,
  analytics: {
    averageConsultationDuration: { type: Number, default: 0 },
    patientSatisfactionScore: { type: Number, default: 0 },
    appointmentCompletionRate: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);
