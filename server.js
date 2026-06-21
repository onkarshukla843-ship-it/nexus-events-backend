const express = require('express'); 
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables FIRST
dotenv.config({ path: './.env' });

// Bring in the Express App and Database connection
const app = require('./app');
const connectDB = require('./config/db');

// Connect to MongoDB 
connectDB(); 

// ==========================================
// 🚨 MOUNT MIDDLEWARE & ROUTES HERE
// (Must happen before app.listen)
// ==========================================

// 1. 🚨 BULLETPROOF PUBLIC UPLOADS FOLDER
// This forces the browser to bypass all strict security blocks for images
app.use('/uploads', (req, res, next) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin',
        'Cross-Origin-Embedder-Policy': 'unsafe-none',
    });
    next();
}, express.static(path.join(__dirname, 'uploads')));

// 2. Connect the Payment Routes
const paymentRoutes = require('./routes/payment'); 
app.use('/api/v1/payments', paymentRoutes);

// 3. Connect the new Upload Routes
const uploadRoutes = require('./routes/uploadRoutes');
app.use('/api/v1/upload', uploadRoutes);


// ==========================================
// START THE SERVER
// ==========================================
const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`[Server] Running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    console.log(`[Server] Local Access: http://localhost:${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.log(`[Error] Unhandled Rejection: ${err.message}`);
    server.close(() => process.exit(1));
});