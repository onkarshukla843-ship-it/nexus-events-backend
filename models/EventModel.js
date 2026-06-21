const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add an event title'],
        trim: true,
        maxlength: [100, 'Title cannot be more than 100 characters']
    },
    description: {
        type: String,
        required: [true, 'Please add a description'],
        maxlength: [1000, 'Description cannot be more than 1000 characters']
    },
    category: {
    type: String,
    enum: ['Tech', 'Music','sports', 'Business', 'Culinary', 'Gaming', 'Art & Design', 'Other'],
    required: true
},
    date: {
        type: Date,
        required: [true, 'Please add an event date']
    },
    location: {
        type: String,
        required: [true, 'Please add a location']
    },
    price: {
        type: Number,
        required: [true, 'Please add a ticket price. Use 0 for free events.'],
        min: [0, 'Price cannot be negative']
    },
    currency: {
        type: String,
        enum: ['INR', 'USD'],
        default: 'INR' // Defaults to India if they don't pick!
    },
    capacity: {
        type: Number,
        required: [true, 'Please add maximum capacity'],
        min: [1, 'Capacity must be at least 1']
    },
    ticketsSold: {
        type: Number,
        default: 0
    },
    imageUrl: {
        type: String,
        default: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'
    },
    organizer: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Event', EventSchema);