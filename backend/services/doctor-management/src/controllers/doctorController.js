const Doctor = require('../models/Doctor');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'medsync-secret-key-2026';

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
      isVerified: false
    });
    
    await doctor.save();
    
    const token = jwt.sign(
      { id: doctor._id, doctorId: doctor._id, email: doctor.contact.email, role: 'doctor' },
      JWT_SECRET,
      { expiresIn: '7d' }
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
    if (!doctor) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const isMatch = await bcrypt.compare(password, doctor.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: doctor._id, doctorId: doctor._id, email: doctor.contact.email, role: 'doctor' },
      JWT_SECRET,
      { expiresIn: '7d' }
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
