const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');

// Initialize Express App
const app = express();

// ==========================================
// 🚨 1. GLOBAL IMAGE BYPASS (MUST BE ABOVE HELMET)
// ==========================================
// This serves the images before the security blanket can block them
app.use('/uploads', (req, res, next) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Cross-Origin-Resource-Policy': 'cross-origin'
    });
    next();
}, express.static(path.join(__dirname, 'uploads')));

// ==========================================
// 2. Global Middleware & Security
// ==========================================
// Relaxing Helmet's CSP for local development so our HTML scripts can run
//app.use(
  //  helmet({
    //    contentSecurityPolicy: false,
   // })
//); // Helmet won't mess with images now!
app.use(xss()); // Prevent cross-site scripting
app.use(cors()); // Allow frontend to talk to backend
app.use(express.json({ limit: '10kb' })); // 🚨 CRITICAL: Allows server to read req.body!

if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev')); // Logger
}

// Rate limiting (Max 100 requests per 10 minutes)
const limiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 100,
    message: 'Too many requests from this IP, please try again in 10 minutes.'
});
app.use('/api', limiter);

// ==========================================
// 3. Static File Serving (The Frontend)
// ==========================================
app.use(express.static(path.join(__dirname, 'frontend'))); // Make sure folder name matches exactly (case sensitive)

// ==========================================
// 4. API Routes
// ==========================================
app.get('/api/v1/health', (req, res) => {
    res.status(200).json({ success: true, message: 'Nexus API is running smoothly.' });
});

app.use('/api/v1/auth', require('./routes/authRoutes'));
app.use('/api/v1/events', require('./routes/eventRoutes'));
app.use('/api/v1/bookings', require('./routes/bookingRoutes'));
app.use('/api/v1/payments', require('./routes/paymentRoutes'));

// ==========================================
// 5. Global Error Handling
// ==========================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.statusCode || 500).json({
        success: false,
        error: err.message || 'Server Error'
    });
});

module.exports = app;