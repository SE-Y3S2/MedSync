/**
 * AUTH MIDDLEWARE — Appointment Service
 *
 * This is a placeholder middleware designed for easy replacement.
 *
 * HOW TO REPLACE:
 *  ─────────────────────────────────────────────────────────────
 *  When the Auth Service is ready, replace the body of this file with:
 *
 *    const jwt = require('jsonwebtoken');
 *    module.exports = (req, res, next) => {
 *      const token = req.headers.authorization?.split(' ')[1];
 *      if (!token) return res.status(401).json({ message: 'No token provided' });
 *      try {
 *        req.user = jwt.verify(token, process.env.JWT_SECRET);
 *        next();
 *      } catch {
 *        res.status(401).json({ message: 'Invalid or expired token' });
 *      }
 *    };
 *  ─────────────────────────────────────────────────────────────
 *
 * CURRENT BEHAVIOUR (stub):
 *  Accepts all requests and attaches a mock user so functional endpoints work
 *  during development without a real auth service.
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!JWT_SECRET) {
        console.error('[Appointment Service] CRITICAL: JWT_SECRET not found in environment.');
        return res.status(500).json({ message: 'Internal Server Error: Auth misconfigured' });
    }

    // ── PRODUCTION MODE ────────────────────────────────────────────────────
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

module.exports = auth;
