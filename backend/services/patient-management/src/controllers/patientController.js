const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Patient = require('../models/Patient');
const Prescription = require('../models/Prescription'); // Added for historical recovery
const { sendEvent } = require('../utils/kafka');
const { JWT_SECRET } = require('../middleware/authMiddleware');

// ───── Authentication ─────

// Register a new patient
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, dateOfBirth, gender, address } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({ message: 'Email, password, first name, and last name are required.' });
    }

    const existing = await Patient.findOne({ email });
    if (existing) {
      return res.status(409).json({ message: 'A patient with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const patient = new Patient({
      email, password: hashedPassword, firstName, lastName,
      phone, dateOfBirth, gender, address
    });

    await patient.save();

    const token = jwt.sign(
      { userId: patient._id, patientId: patient._id, email: patient.email, role: 'patient' },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    // Emit Kafka event
    await sendEvent('patient-events', {
      type: 'PATIENT_REGISTERED',
      patientId: patient._id,
      email: patient.email,
      timestamp: new Date()
    });

    res.status(201).json({ token, patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const patient = await Patient.findOne({ email });
    if (!patient) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, patient.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: patient._id, patientId: patient._id, email: patient.email, role: 'patient' },
      JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(200).json({ token, patient });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ───── Profile Management ─────

// Get authenticated patient's profile
exports.getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update authenticated patient's profile
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, dateOfBirth, gender, address, bloodType, allergies, emergencyContact } = req.body;

    const patient = await Patient.findById(req.user.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // Update fields
    if (firstName) patient.firstName = firstName;
    if (lastName) patient.lastName = lastName;
    if (phone !== undefined) patient.phone = phone;
    if (dateOfBirth) patient.dateOfBirth = dateOfBirth;
    if (gender) patient.gender = gender;
    if (address !== undefined) patient.address = address;
    if (bloodType !== undefined) patient.bloodType = bloodType;
    if (allergies !== undefined) patient.allergies = allergies;
    if (emergencyContact !== undefined) patient.emergencyContact = emergencyContact;

    await patient.save();

    // Emit Kafka event
    await sendEvent('patient-events', {
      type: 'PATIENT_UPDATED',
      patientId: patient._id,
      email: patient.email,
      timestamp: new Date()
    });

    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ───── Doctor-scoped Access ─────

// Doctor or admin viewing a specific patient's records (for consultation prep)
exports.getPatientForProvider = async (req, res) => {
  try {
    if (!['doctor', 'admin'].includes(req.user?.role)) {
      return res.status(403).json({ message: 'Only doctors or admins can view other patients.' });
    }
    const patient = await Patient.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json({
      profile: {
        id: patient._id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        email: patient.email,
        phone: patient.phone,
        dateOfBirth: patient.dateOfBirth,
        gender: patient.gender,
        bloodType: patient.bloodType,
        allergies: patient.allergies,
      },
      medicalHistory: patient.medicalHistory,
      prescriptions: patient.prescriptions,
      documents: patient.documents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin listing all patients
exports.listPatients = async (req, res) => {
  try {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required.' });
    }
    const patients = await Patient.find(
      {},
      'firstName lastName email phone dateOfBirth gender createdAt'
    ).sort({ createdAt: -1 });
    res.status(200).json(patients);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ───── Medical Records ─────

// Get medical history and prescriptions with automatic historical sync
exports.getRecords = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    // --- HISTORICAL DATA RECOVERY ---
    // If the patient is missing prescriptions that exist in the global prescriptions collection,
    // we pull them in now. This fixes the sync gap caused by previous service crashes.
    try {
      const globalPrescriptions = await Prescription.find({ patientId });
      
      let hasNewData = false;
      for (const gp of globalPrescriptions) {
        // 1. Find if this prescription already exists locally
        const existingLocalIndex = patient.prescriptions.findIndex(p => 
          p.verificationId === gp.verificationId || 
          (p.medication === gp.medications.map(m => m.medication).join(', ') && 
           Math.abs(new Date(p.date) - new Date(gp.issuedAt)) < 60000)
        );

        if (existingLocalIndex !== -1) {
          // REPAIR: If it exists but lacks a verificationId, attach it now
          if (!patient.prescriptions[existingLocalIndex].verificationId) {
            console.log(`[Recovery] Repairing missing verificationId for prescription ${gp._id}`);
            patient.prescriptions[existingLocalIndex].verificationId = gp.verificationId || gp._id;
            hasNewData = true;
          }
        } else {
          // ADD NEW: Prescription doesn't exist locally at all
          console.log(`[Recovery] Pushing missing prescription ${gp.verificationId || gp._id} to patient ${patientId}`);
          patient.prescriptions.push({
            date: gp.issuedAt || new Date(),
            medication: gp.medications.map(m => m.medication).join(', '),
            dosage: gp.medications.map(m => `${m.medication}: ${m.dosage}`).join(' | '),
            frequency: gp.medications.map(m => m.frequency).join(', '),
            duration: gp.medications.map(m => m.duration).join(', '),
            instructions: gp.instructions,
            prescribedBy: gp.doctorName ? `Dr. ${gp.doctorName}` : 'Doctor',
            verificationId: gp.verificationId || gp._id
          });
          
          // Also add to documents for consistency if not there
          const docExists = patient.documents.some(d => d.verificationId === (gp.verificationId || gp._id));
          if (!docExists) {
            patient.documents.push({
              fileName: `Prescription_${gp.verificationId || gp._id.toString()}.pdf`,
              fileUrl: `/verify/${gp.verificationId || gp._id.toString()}`,
              verificationId: gp.verificationId || gp._id.toString(),
              uploadDate: new Date(),
              type: 'Prescription'
            });
          }
          hasNewData = true;
        }
      }

      if (hasNewData) {
        await patient.save();
        console.log(`[Recovery] Successfully recovered historical data for patient ${patientId}`);
      }
    } catch (recoveryErr) {
      console.error('[Recovery] Error during historical sync:', recoveryErr.message);
      // Continue returning existing records even if recovery fails
    }
    // ---------------------------------

    res.status(200).json({
      medicalHistory: patient.medicalHistory,
      prescriptions: patient.prescriptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a medical history record
exports.addMedicalRecord = async (req, res) => {
  try {
    const { description, diagnosis, doctor, notes, date } = req.body;
    if (!description) return res.status(400).json({ message: 'Description is required.' });

    const patient = await Patient.findById(req.user.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const record = { description, diagnosis, doctor, notes };
    if (date) record.date = date;

    patient.medicalHistory.push(record);
    await patient.save();

    res.status(201).json(patient.medicalHistory[patient.medicalHistory.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add a prescription (Original Patient use-case)
exports.addPrescription = async (req, res) => {
  try {
    const { medication, dosage, frequency, duration, instructions, prescribedBy, date } = req.body;
    if (!medication || !dosage) return res.status(400).json({ message: 'Medication and dosage are required.' });

    const patientId = req.user.patientId;
    if (!patientId) return res.status(401).json({ message: 'Patient not authenticated' });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const prescription = { medication, dosage, frequency, duration, instructions, prescribedBy };
    if (date) prescription.date = date;

    patient.prescriptions.push(prescription);
    await patient.save();

    res.status(201).json(patient.prescriptions[patient.prescriptions.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Doctor issues a prescription to a patient
exports.doctorIssuePrescription = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { medication, dosage, frequency, duration, instructions, prescribedBy, date } = req.body;

    if (!req.user.doctorId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Forbidden. Only doctors can issue prescriptions.' });
    }

    if (!medication || !dosage) return res.status(400).json({ message: 'Medication and dosage are required.' });

    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const prescription = { medication, dosage, frequency, duration, instructions, prescribedBy };
    if (date) prescription.date = date;

    patient.prescriptions.push(prescription);
    await patient.save();

    // Emit Kafka event
    await sendEvent('patient-events', {
      type: 'PRESCRIPTION_ISSUED',
      patientId: patient._id,
      prescribedBy: prescribedBy,
      medication,
      timestamp: new Date()
    });

    res.status(201).json(patient.prescriptions[patient.prescriptions.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ───── Document Management ─────

// Upload document
exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const patient = await Patient.findById(req.user.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const type = req.body.type || 'Report';

    const fileUrl = req.file.path.replace(/\\/g, '/'); // Normalize slashes for URL compatibility
    
    const newDoc = {
      fileName: req.file.originalname,
      fileUrl: fileUrl,
      type: type
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

    res.status(201).json(patient.documents[patient.documents.length - 1]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient documents
exports.getDocuments = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient.documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a document
exports.deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const patient = await Patient.findById(req.user.patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });

    const docIndex = patient.documents.findIndex(d => d._id.toString() === id);
    if (docIndex === -1) return res.status(404).json({ message: 'Document not found' });

    patient.documents.splice(docIndex, 1);
    await patient.save();

    res.status(200).json({ message: 'Document deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ───── Doctor Oversight / Admin ─────

// Get patient profile by ID (for doctors to review allergies etc)
exports.getPatientProfile = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId).select('-password');
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient records (medical history + prescriptions)
exports.getPatientRecords = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json({
      medicalHistory: patient.medicalHistory,
      prescriptions: patient.prescriptions
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get patient documents
exports.getPatientDocuments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const patient = await Patient.findById(patientId);
    if (!patient) return res.status(404).json({ message: 'Patient not found' });
    res.status(200).json(patient.documents);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
