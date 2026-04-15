const mongoose = require('mongoose');

const medicalRecordSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  description: { type: String, required: true },
  diagnosis: { type: String },
  doctor: { type: String },
  notes: { type: String }
});

const prescriptionSchema = new mongoose.Schema({
  date: { type: Date, default: Date.now },
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  frequency: { type: String },
  duration: { type: String },
  instructions: { type: String },
  prescribedBy: { type: String },
  verificationId: { type: String } // Link to digital certificate/QR
});

const documentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  verificationId: { type: String }, // Link to digital prescription portal
  uploadDate: { type: Date, default: Date.now },
  type: { type: String, enum: ['Report', 'Scan', 'Prescription', 'Lab Result', 'Other'], default: 'Report' }
});

const emergencyContactSchema = new mongoose.Schema({
  name: { type: String },
  relationship: { type: String },
  phone: { type: String }
});

const patientSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  dateOfBirth: { type: Date },
  gender: { type: String, enum: ['Male', 'Female', 'Other'] },
  address: { type: String },
  bloodType: { type: String, enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', ''] },
  allergies: [{ type: String }],
  emergencyContact: emergencyContactSchema,
  medicalHistory: [medicalRecordSchema],
  prescriptions: [prescriptionSchema],
  documents: [documentSchema]
}, { timestamps: true });

// Don't return password in JSON responses
patientSchema.methods.toJSON = function() {
  const patient = this.toObject();
  delete patient.password;
  return patient;
};

module.exports = mongoose.model('Patient', patientSchema);
