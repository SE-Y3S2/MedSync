const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'medsync-secret-key-2026';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authentication required. Please provide a valid token.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Support multiple roles and unified auth tokens
    req.user = {
      id: decoded.id || decoded.patientId || decoded.doctorId,
      patientId: decoded.patientId || decoded.id,
      doctorId: decoded.doctorId || decoded.id,
      email: decoded.email,
      role: decoded.role || (decoded.patientId ? 'patient' : null)
    };

    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = { authMiddleware, JWT_SECRET };
