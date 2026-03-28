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

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // ── STUB MODE: no JWT_SECRET configured ──────────────────────────────
    // Remove this block once the Auth Service is integrated.
    if (!process.env.JWT_SECRET) {
        req.user = { id: 'dev-user', role: 'patient' }; // mock user
        return next();
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
