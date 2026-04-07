const Doctor = require('../models/Doctor');
const Prescription = require('../models/Prescription');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const qrcode = require('qrcode');
const crypto = require('crypto');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    console.error('[Doctor Management] CRITICAL: JWT_SECRET not found in environment.');
}

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

// Dynamic Analytics implementation
exports.getAnalytics = async (req, res) => {
  try {
    const doctorId = req.params.id;
    
    // Authorization: Admin or the doctor themselves
    if (req.user && req.user.role !== 'admin' && req.user.id !== doctorId) {
        return res.status(403).json({ message: 'Forbidden: You cannot view analytics for another doctor.' });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    // Calculate dynamic stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Aggregate prescriptions over last 7 days
    const prescriptionTrend = await Prescription.aggregate([
      { 
        $match: { 
          doctorId: doctorId,
          issuedAt: { $gte: sevenDaysAgo }
        } 
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$issuedAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    // Format for frontend Recharts (ensure we have entries for all days)
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const match = prescriptionTrend.find(p => p._id === dateStr);
      chartData.push({
        date: dateStr,
        prescriptions: match ? match.count : 0,
        appointments: Math.floor(Math.random() * 5) + 2 // Mocking appointment trend for now
      });
    }

    res.json({
      ...doctor.analytics.toObject(),
      prescriptionTrend: chartData,
      totalPrescriptions: await Prescription.countDocuments({ doctorId })
    });
  } catch (error) {
    console.error('[Doctor Service] Analytics Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Availability management
exports.getAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor.availability || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addAvailability = async (req, res) => {
  try {
    const { day, startTime, endTime } = req.body;
    
    // Authorization check
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ message: 'Forbidden: You cannot modify another doctor\'s availability.' });
    }

    // Basic time validation
    if (startTime >= endTime) {
        return res.status(400).json({ message: 'Start time must be before end time.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });

    doctor.availability.push({ day, startTime, endTime });
    await doctor.save();
    
    res.status(201).json(doctor.availability);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.deleteAvailability = async (req, res) => {
  try {
    console.log(`[Doctor Service] DELETE request received for doctor: ${req.params.id}, slot: ${req.params.slotId}`);
    console.log(`[Doctor Service] Request User:`, req.user);
    
    // Authorization check
    if (req.user && req.user.role !== 'admin' && req.user.id !== req.params.id) {
        console.warn(`[Doctor Service] 403 Forbidden: User ID ${req.user.id} does not match target ID ${req.params.id}`);
        return res.status(403).json({ message: 'Forbidden: You cannot modify another doctor\'s availability.' });
    }

    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
        console.error(`[Doctor Service] Doctor not found with ID: ${req.params.id}`);
        return res.status(404).json({ message: 'Doctor not found' });
    }

    console.log(`[Doctor Service] Current availability count: ${doctor.availability.length}`);
    console.log(`[Doctor Service] Available IDs:`, doctor.availability.map(s => s._id.toString()));

    // Try both pull methods for safety
    const beforeCount = doctor.availability.length;
    doctor.availability.pull(req.params.slotId);
    
    if (doctor.availability.length === beforeCount) {
        console.warn(`[Doctor Service] Slot ID ${req.params.slotId} not found in doctor's availability array.`);
    }

    await doctor.save();
    console.log(`[Doctor Service] Successfully processed delete. New availability count: ${doctor.availability.length}`);
    res.json(doctor.availability);
  } catch (error) {
    console.error(`[Doctor Service] Delete slot error:`, error);
    res.status(400).json({ message: error.message });
  }
};

// Prescription Management
exports.issuePrescription = async (req, res) => {
  try {
    const { patientId, patientName, doctorName, appointmentId, medications, instructions, signatureBase64 } = req.body;
    
    // Authorization: User must be a doctor
    if (req.user && req.user.role !== 'doctor' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only doctors can issue prescriptions.' });
    }

    if (!signatureBase64) {
      return res.status(400).json({ message: 'A digital signature is required to issue a prescription.' });
    }

    const verificationId = crypto.randomBytes(6).toString('hex').toUpperCase(); // 12-char ID
    
    const prescription = new Prescription({
      patientId,
      patientName,
      doctorId: req.user.id,
      doctorName,
      appointmentId,
      medications,
      instructions,
      verificationId,
      signatureBase64
    });

    await prescription.save();

    // Generate QR Code base64
    const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${verificationId}`;
    const qrCodeBase64 = await qrcode.toDataURL(verifyUrl);

    console.log(`[Doctor Service] Prescription issued: ${verificationId} by Dr. ${doctorName}`);
    
    res.status(201).json({ 
      prescription, 
      qrCode: qrCodeBase64,
      verifyUrl 
    });
  } catch (error) {
    console.error(`[Doctor Service] Issue prescription error:`, error);
    res.status(400).json({ message: error.message });
  }
};

exports.getPrescriptionByVerifyId = async (req, res) => {
  try {
    const { verificationId } = req.params;
    const prescription = await Prescription.findOne({ verificationId });
    
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found or invalid.' });
    }

    res.json(prescription);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


