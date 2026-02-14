const { verifyToken } = require('../utils/jwt');

/**
 * Authentication middleware
 * Verifies JWT token from Authorization header
 * Attaches operator info to req.operator if valid
 */
const authenticate = (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'No token provided. Please login.',
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = verifyToken(token);

        // Attach operator info to request
        req.operator = {
            id: decoded.operatorId,
            username: decoded.username,
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token. Please login again.',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed.',
            error: error.message,
        });
    }
};

module.exports = { authenticate };
