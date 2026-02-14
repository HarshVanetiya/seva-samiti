const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'seva-smiti-secret-key-change-in-production';
const JWT_EXPIRES_IN = '30d'; // 30 days

/**
 * Generate JWT token for operator
 * @param {Object} payload - Data to encode in token (e.g., { operatorId, username })
 * @returns {string} JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded payload
 * @throws {Error} If token is invalid or expired
 */
const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};

module.exports = {
    generateToken,
    verifyToken,
    JWT_SECRET,
};
