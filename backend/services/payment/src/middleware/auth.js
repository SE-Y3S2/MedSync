/**
 * AUTH MIDDLEWARE — Payment Service
 *
 * Same stub-to-production pattern as the appointment service.
 *
 * HOW TO REPLACE (when Auth Service is ready):
 *  Remove the stub block below and keep only the PRODUCTION MODE block.
 */

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    // ── STUB MODE: no JWT_SECRET configured ──────────────────────────────
    if (!process.env.JWT_SECRET) {
        req.user = { id: 'dev-user', role: 'patient' };
        return next();
    }

    // ── PRODUCTION MODE ────────────────────────────────────────────────────
    const authHeader = req.headers.authorization;
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
