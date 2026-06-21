const express = require('express');
const router = express.Router();
const { createBooking, getUserBookings, getEventBookings } = require('../controllers/bookingController');

// Route 1: Create a new booking
router.post('/', createBooking);

// Route 2: Get all bookings for a specific user (THIS IS THE MISSING PIECE!)
router.get('/user/:userId', getUserBookings);

// Add this alongside your other routes
router.get('/event/:eventId', getEventBookings);

module.exports = router;