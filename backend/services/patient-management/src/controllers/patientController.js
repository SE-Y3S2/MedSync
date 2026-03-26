const Patient = require('../models/Patient');
const { sendEvent } = require('../utils/kafka');

// Create or update patient profile
exports.updateProfile = async (req, res) => {
  try {
    const { email, firstName, lastName, phone, dateOfBirth, gender, address } = req.body;
    let patient = await Patient.findOne({ email });

    if (patient) {
      // Update
      patient.firstName = firstName;
      patient.lastName = lastName;
      patient.phone = phone;
      patient.dateOfBirth = dateOfBirth;
      patient.gender = gender;
      patient.address = address;
    } else {
      // Create
      patient = new Patient({
        email, firstName, lastName, phone, dateOfBirth, gender, address
      });
    }

    await patient.save();
    
    // Emit Kafka event
    await sendEvent('patient-events', {
      type: patient.isNew ? 'PATIENT_REGISTERED' : 'PATIENT_UPDATED',
      patientId: patient._id,
      email: patient.email,
      timestamp: new Date()
    });

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient profile
exports.getProfile = async (req, res) => {
  try {
    const { email } = req.query;
    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get medical history and prescriptions
exports.getRecords = async (req, res) => {
  try {
    const { email } = req.query;
    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json({
      medicalHistory: patient.medicalHistory,
      prescriptions: patient.prescriptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    const { email, type } = req.body;
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const newDoc = {
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      type: type || 'Report'
    };

    patient.documents.push(newDoc);
    await patient.save();

    // Emit Kafka event
    await sendEvent('patient-events', {
      type: 'DOCUMENT_UPLOADED',
      patientId: patient._id,
      documentName: newDoc.fileName,
      documentType: newDoc.type,
      timestamp: new Date()
    });

    res.status(201).json(newDoc);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient documents
exports.getDocuments = async (req, res) => {
  try {
    const { email } = req.query;
    const patient = await Patient.findOne({ email });
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient.documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
