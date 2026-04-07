const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  specialty: { type: String, required: true },
  qualifications: [String],
  contact: {
    email: { type: String, required: true, unique: true },
    phone: String,
  },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },
  bio: String,
  photoUrl: String,
  availability: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      startTime: { type: String, required: true }, // e.g., "09:00"
      endTime: { type: String, required: true }, // e.g., "17:00"
      isBooked: { type: Boolean, default: false }
    }
  ],
  analytics: {
    averageConsultationDuration: { type: Number, default: 0 },
    patientSatisfactionScore: { type: Number, default: 0 },
    appointmentCompletionRate: { type: Number, default: 0 }
  }
}, { timestamps: true });

// Don't return password in JSON responses
doctorSchema.methods.toJSON = function() {
  const doctor = this.toObject();
  delete doctor.password;
  return doctor;
};

module.exports = mongoose.model('Doctor', doctorSchema);
