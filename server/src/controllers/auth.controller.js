const bcrypt = require('bcrypt');
const prisma = require('../utils/prisma');
const { generateToken } = require('../utils/jwt');

/**
 * Register a new operator (admin user)
 * This should only be used for initial setup or by super admin
 */
const register = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long',
            });
        }

        // Check if operator already exists
        const existingOperator = await prisma.operator.findUnique({
            where: { username },
        });

        if (existingOperator) {
            return res.status(409).json({
                success: false,
                message: 'Operator with this username already exists',
            });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create operator
        const operator = await prisma.operator.create({
            data: {
                username,
                password: hashedPassword,
            },
            select: {
                id: true,
                username: true,
                createdAt: true,
            },
        });

        // Generate token
        const token = generateToken({
            operatorId: operator.id,
            username: operator.username,
        });

        res.status(201).json({
            success: true,
            message: 'Operator registered successfully',
            data: {
                operator,
                token,
            },
        });
    } catch (error) {
        console.error('Error in register:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register operator',
            error: error.message,
        });
    }
};

/**
 * Login operator
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required',
            });
        }

        // Find operator
        const operator = await prisma.operator.findUnique({
            where: { username },
        });

        if (!operator) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, operator.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password',
            });
        }

        // Generate token
        const token = generateToken({
            operatorId: operator.id,
            username: operator.username,
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                operator: {
                    id: operator.id,
                    username: operator.username,
                },
                token,
            },
        });
    } catch (error) {
        console.error('Error in login:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message,
        });
    }
};

/**
 * Get current operator info (requires authentication)
 */
const getCurrentOperator = async (req, res) => {
    try {
        const operator = await prisma.operator.findUnique({
            where: { id: req.operator.id },
            select: {
                id: true,
                username: true,
                createdAt: true,
            },
        });

        res.status(200).json({
            success: true,
            data: { operator },
        });
    } catch (error) {
        console.error('Error in getCurrentOperator:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get operator info',
            error: error.message,
        });
    }
};

module.exports = {
    register,
    login,
    getCurrentOperator,
};
