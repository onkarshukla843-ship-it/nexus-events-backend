const express = require('express');
const router = express.Router();

// 🚨 NEW: Import your authentication middleware (The Security Guard!)
// Note: If your function inside auth.js is named 'verifyToken' instead of 'protect', just swap the name here!
const { protect } = require('../middleware/auth'); 

// Import the controller functions 
const { getEvents, createEvent, updateEvent, getEventById } = require('../controllers/eventController');

// Route: /api/v1/events
router.route('/')
    .get(getEvents)                  // Public: Anyone can browse the event catalog
    .post(protect, createEvent);     // Protected: Only logged-in users can host new events

// Route: /api/v1/events/:id
router.route('/:id')
    .get(getEventById)               // Public: Anyone can view a single event's details
    .put(protect, updateEvent);      // Protected: Only logged-in users can edit events

module.exports = router;