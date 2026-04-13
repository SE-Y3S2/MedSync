const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

    const existing = await Doctor.findOne({ 'contact.email': contact.email });
    if (existing) {
      return res.status(409).json({ message: 'A doctor with this email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const doctor = new Doctor({
      name, specialty, qualifications, contact, bio,
      password: hashedPassword,
      isVerified: false
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

    res.status(201).json({ token, doctor });
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
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { userId: doctor._id, doctorId: doctor._id, email: doctor.contact.email, role: 'doctor' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRE }
    );

    res.status(200).json({ token, doctor });
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

// ── Availability ─────────────────────────────────────────────────────────────

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
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: You can only manage your own schedule.' });
    }

    const { day, startTime, endTime, maxPatients } = req.body || {};
    if (!day || !startTime || !endTime) {
      return res.status(400).json({ message: 'day, startTime, and endTime are required.' });
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
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ message: 'Forbidden: You can only manage your own schedule.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    const before = doctor.availability.length;
    doctor.availability = doctor.availability.filter(
      (slot) => slot._id.toString() !== req.params.slotId
    );
    if (doctor.availability.length === before) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    await doctor.save();
    res.json({ message: 'Slot removed', availability: doctor.availability });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Bonus implementation
exports.getAnalytics = async (req, res) => {
  try {
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot view analytics for another doctor.' });
    }
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor.analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
