/**
 * AUTH MIDDLEWARE — Payment Service
 *
 * Same stub-to-production pattern as the appointment service.
 *
 * HOW TO REPLACE (when Auth Service is ready):
 *  Remove the stub block below and keep only the PRODUCTION MODE block.
 */

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

const auth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!JWT_SECRET) {
        console.error('[Payment Service] CRITICAL: JWT_SECRET not found in environment.');
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
