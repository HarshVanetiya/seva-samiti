require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRouter = require('./routes/auth.router');
const memberRouter = require('./routes/member.router');
const loanRouter = require('./routes/loan.router');
const transactionRouter = require('./routes/transaction.router');
const overviewRouter = require('./routes/overview.router');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRouter);
app.use('/api/members', memberRouter);
app.use('/api/loans', loanRouter);
app.use('/api/transactions', transactionRouter);
app.use('/api/dashboard', overviewRouter);
app.use('/api/reports', require('./routes/report.routes'));

// Health check route
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Community Fund Management System API is running',
        timestamp: new Date().toISOString(),
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found',
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
    });
});
