const Event = require('../models/EventModel.js');

// --- 1. Get All Events ---
const getEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('organizer', 'name email'); // Populating makes the output better
        res.status(200).json({ success: true, count: events.length, data: events });
    } catch (error) {
        res.status(500).json({ success: false, error: 'Server Error fetching events' });
    }
};

// --- 2. Create an Event (ENHANCED) ---
// ==========================================
// Create a New Event
// ==========================================
const createEvent = async (req, res) => {
    try {
        // 🚨 THE FIX: Find the logged-in user's ID
        const loggedInUserId = req.user?._id || req.user?.id || req.userId;
        
        if (!loggedInUserId) {
            return res.status(401).json({ success: false, error: 'Not authorized to create events' });
        }

        // 🚨 CRITICAL: Stamp the event with the user's ID so they own it!
        req.body.organizer = loggedInUserId;

        // Save the event to the database
        const event = await Event.create(req.body);
        
        res.status(201).json({ success: true, data: event });

    } catch (error) {
        console.error("🔥 CREATE EVENT ERROR:", error);
        res.status(400).json({ success: false, error: error.message });
    }
};

// ==========================================
// Update an Event (Bulletproof Version)
// ==========================================
const updateEvent = async (req, res) => {
    try {
        // 1. Find the event
        let event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }

        // 2. Safely find the logged-in user's ID, no matter how the auth middleware formats it
        const loggedInUserId = req.user?._id || req.user?.id || req.userId;

        if (!loggedInUserId) {
            return res.status(401).json({ success: false, error: 'Authentication error: Could not find User ID.' });
        }

        // 3. The Security Check
        if (event.organizer.toString() !== loggedInUserId.toString()) {
            return res.status(403).json({ 
                success: false, 
                error: 'Forbidden: You are not the organizer of this event.' 
            });
        }

        // 4. Update the event
        event = await Event.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({ success: true, data: event });

    } catch (error) {
        // 🚨 This will print the exact reason for the crash in your terminal!
        console.error("🔥 UPDATE EVENT CRASH:", error); 
        res.status(500).json({ success: false, error: error.message });
    }
};

// --- 4. Fetch Single Event ---
const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) return res.status(404).json({ success: false, error: 'Event not found' });
        res.status(200).json({ success: true, data: event });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { getEvents, createEvent, updateEvent, getEventById };