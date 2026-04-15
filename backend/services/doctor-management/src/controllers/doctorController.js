const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const crypto = require('crypto');
const { sendEvent } = require('../utils/kafka');

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET is not set');
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRE = process.env.JWT_EXPIRE || '7d';

exports.registerDoctor = async (req, res) => {
  try {
    const { name, specialty, qualifications, contact, bio, password } = req.body;

    if (!password || !contact || !contact.email) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ message: 'Name is required.' });
    }

    const specialtyResolved =
      (specialty && String(specialty).trim()) || 'General Practice';

    let quals = [];
    if (Array.isArray(qualifications)) {
      quals = qualifications.map((q) => String(q).trim()).filter(Boolean);
    } else if (typeof qualifications === 'string' && qualifications.trim()) {
      quals = qualifications.split(',').map((q) => q.trim()).filter(Boolean);
    }

    const existing = await Doctor.findOne({ 'contact.email': contact.email });
    if (existing) {
      return res.status(409).json({ message: 'A doctor with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const doctor = new Doctor({
      name,
      specialty: specialtyResolved,
      qualifications: quals,
      contact,
      bio,
      password: hashedPassword,
      isVerified: false,
    });

    await doctor.save();

    await sendEvent('doctor-events', {
      type: 'DOCTOR_REGISTERED',
      doctorId: doctor._id,
      email: doctor.contact?.email,
      name: doctor.name,
      specialty: doctor.specialty,
      timestamp: new Date(),
    });

    const token = jwt.sign(
      { userId: doctor._id, doctorId: doctor._id, email: doctor.contact.email, role: 'doctor' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const doctorObj = doctor.toObject();
    delete doctorObj.password;
    doctorObj.role = 'doctor';

    res.status(201).json({ token, doctor: doctorObj });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const doctor = await Doctor.findOne({ 'contact.email': email });
    if (!doctor) return res.status(401).json({ message: 'Invalid email or password.' });

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid email or password.' });

    const token = jwt.sign(
      { userId: doctor._id, doctorId: doctor._id, email: doctor.contact.email, role: 'doctor' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    const doctorObj = doctor.toObject();
    delete doctorObj.password;
    doctorObj.role = 'doctor';

    res.status(200).json({ token, doctor: doctorObj });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateDoctor = async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
    }
    const doctor = await Doctor.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.listDoctors = async (req, res) => {
  try {
    const { specialty } = req.query;
    const filter = specialty ? { specialty: new RegExp(specialty, 'i') } : {};
    const doctors = await Doctor.find(filter);
    res.json(doctors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── Analytics (dynamic, with prescription trend) ──────────────────────────────
exports.getAnalytics = async (req, res) => {
  try {
    const doctorId = req.params.id;

    if (req.user && req.user.role !== 'admin' && req.user.id !== doctorId) {
      return res.status(403).json({ message: 'Forbidden: You cannot view analytics for another doctor.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const prescriptionTrend = await Prescription.aggregate([
      { $match: { doctorId: doctorId, issuedAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$issuedAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = prescriptionTrend.find(p => p._id === dateStr);
      
      // For this assignment, we use real prescription counts.
      // We will leave 'appointments' for the frontend to overlay from the Appointment Service.
      chartData.push({
        date: dateStr,
        prescriptions: match ? match.count : 0,
        appointments: 0 // Will be populated or calculated by frontend from appointment stats
      });
    }

    res.json({
      ...doctor.analytics.toObject(),
      prescriptionTrend: chartData,
      totalPrescriptions: await Prescription.countDocuments({ doctorId }),
    });
  } catch (error) {
    console.error('[Doctor Service] Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// ── Availability ──────────────────────────────────────────────────────────────
exports.getAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('availability name specialty');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor.availability || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addAvailability = async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: You can only manage your own schedule.' });
    }

    const { day, startTime, endTime, maxPatients } = req.body || {};
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: 'day, startTime, and endTime are required.' });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.availability.push({ day, startTime, endTime, maxPatients });
    await doctor.save();

    await sendEvent('doctor-events', {
      type: 'DOCTOR_AVAILABILITY_UPDATED',
      doctorId: doctor._id,
      timestamp: new Date(),
    });

    res.status(201).json(doctor.availability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: "Forbidden: You cannot modify another doctor's availability." });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const before = doctor.availability.length;
    doctor.availability.pull(req.params.slotId);

    if (doctor.availability.length === before) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    await doctor.save();
    res.json({ message: 'Slot removed', availability: doctor.availability });
  } catch (error) {
    console.error('[Doctor Service] Delete slot error:', error);
    res.status(400).json({ message: error.message });
  }
};

// ── Prescriptions (QR-signed, verifiable) ─────────────────────────────────────
exports.issuePrescription = async (req, res) => {
  try {
    const { patientId, patientName, doctorName, appointmentId, medications, instructions, signatureBase64 } = req.body;

    if (req.user && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can issue prescriptions.' });
    }

    if (!signatureBase64) {
      return res.status(400).json({ message: 'A digital signature is required to issue a prescription.' });
    }

    const verificationId = crypto.randomBytes(6).toString('hex').toUpperCase();

    const prescription = new Prescription({
      patientId,
      patientName,
      doctorId: req.user.id,
      doctorName,
      appointmentId,
      medications,
      instructions,
      verificationId,
      signatureBase64,
    });

    await prescription.save();

    // Notify other services (Patient Management) via Kafka
    await sendEvent('doctor-events', {
      type: 'PRESCRIPTION_ISSUED',
      prescriptionId: prescription._id,
      patientId: prescription.patientId,
      patientName: prescription.patientName,
      doctorName: prescription.doctorName,
      medications: prescription.medications,
      instructions: prescription.instructions,
      verificationId: prescription.verificationId,
      timestamp: new Date()
    });

    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationId}`;
    const qrCodeBase64 = await qrcode.toDataURL(verifyUrl);

    console.log(`[Doctor Service] Prescription issued: ${verificationId} by Dr. ${doctorName}`);

    res.status(201).json({ prescription, qrCode: qrCodeBase64, verifyUrl });
  } catch (error) {
    console.error('[Doctor Service] Issue prescription error:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getPrescriptionByVerifyId = async (req, res) => {
  try {
    const vid = req.params.verificationId;
    
    // 1. Try to find by verificationId (New records)
    let prescription = await Prescription.findOne({ verificationId: vid });
    
    // 2. Fallback to _id if not found and it looks like a Mongo ID (Legacy records)
    if (!prescription && vid.match(/^[0-9a-fA-F]{24}$/)) {
      prescription = await Prescription.findById(vid);
    }
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or invalid.' });
    }
    
    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
