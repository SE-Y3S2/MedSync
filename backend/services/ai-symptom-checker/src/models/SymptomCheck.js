const mongoose = require('mongoose');

const symptomResultSchema = new mongoose.Schema({
  specialty: { type: String, required: true },
  suggestions: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'emergency'], required: true }
});

const symptomCheckSchema = new mongoose.Schema({
  patientId: { type: String },
  symptoms: { type: String, required: true },
  results: [symptomResultSchema],
  overallUrgency: { type: String, enum: ['low', 'medium', 'high', 'emergency'], default: 'low' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SymptomCheck', symptomCheckSchema);
