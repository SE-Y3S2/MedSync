const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  doctor: { type: String },
  notes: { type: String }
});

const prescriptionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  instructions: { type: String },
  prescribedBy: { type: String }
});

const documentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now },
  type: { type: String } // e.g., 'Report', 'Scan', 'Prescription'
});

const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: { type: String },
  medicalHistory: [medicalRecordSchema],
  prescriptions: [prescriptionSchema],
  documents: [documentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);
