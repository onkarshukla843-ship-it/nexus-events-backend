const Booking = require('../models/BookingModel');
const Event = require('../models/EventModel');
const User = require('../models/UserModel'); // 🚨 NEW: We need this to get their email address!
const sendEmail = require('../utils/sendEmail'); // 🚨 NEW: Our email engine!

// ==========================================
// 1. Create a New Booking
// ==========================================
const createBooking = async (req, res) => {
    try {
        const { eventId, userId, quantity } = req.body;

        // ENHANCEMENT: Strict Input Validation
        if (!eventId || !userId || !quantity) {
            return res.status(400).json({ 
                success: false, 
                error: 'Missing required fields: eventId, userId, or quantity' 
            });
        }

        if (quantity < 1 || quantity > 5) {
            return res.status(400).json({
                success: false,
                error: 'You can only book between 1 and 5 tickets.'
            });
        }

        // 1. Find the target event
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ success: false, error: 'Event not found' });
        }

        // 2. Make sure they aren't requesting more tickets than what is left
        if (event.ticketsSold + quantity > event.capacity) {
            const ticketsLeft = event.capacity - event.ticketsSold;
            return res.status(400).json({ 
                success: false, 
                error: `Not enough tickets left. Only ${ticketsLeft} available!` 
            });
        }

        // 3. Calculate the money! (Price * Quantity)
        const totalAmount = event.price * quantity;

        // 4. Create the official booking record
        const booking = await Booking.create({
            user: userId,
            event: eventId,
            quantity: quantity,
            totalAmount: totalAmount,
            status: 'Confirmed'
        });

        // 5. Update the event's sold ticket counter
        event.ticketsSold += quantity;
        await event.save();

        // ==========================================
        // 🚨 6. SEND THE AUTOMATED EMAIL RECEIPT 🚨
        // ==========================================
        try {
            // Find the user so we know where to send the email
            const user = await User.findById(userId);
            
            if (user && user.email) {
                const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });

                const emailHTML = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
                        <div style="background: #0a0a0f; padding: 20px; text-align: center;">
                            <h1 style="color: #00f2fe; margin: 0; font-size: 24px;">NexusEvents</h1>
                        </div>
                        <div style="padding: 30px; background: #ffffff; color: #333333;">
                            <h2 style="margin-top: 0; color: #111;">You're going to ${event.title}!</h2>
                            <p style="font-size: 16px;">Hi <strong style="text-transform: capitalize;">${user.name}</strong>,</p>
                            <p style="font-size: 16px; line-height: 1.5;">Your payment was successful and your tickets are officially secured. We can't wait to see you there!</p>
                            
                            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #00f2fe;">
                                <p style="margin: 5px 0; font-size: 16px;"><strong>📅 Date:</strong> ${eventDate}</p>
                                <p style="margin: 5px 0; font-size: 16px;"><strong>📍 Location:</strong> ${event.location}</p>
                                <p style="margin: 5px 0; font-size: 16px;"><strong>🎟️ Quantity:</strong> ${quantity} Ticket(s)</p>
                            </div>
                            
                            <p style="font-size: 16px;">You can view your digital tickets anytime on your dashboard.</p>
                            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                            <p style="color: #888; font-size: 12px; text-align: center;">Need help? Reply to this email.<br>Thanks for using NexusEvents!</p>
                        </div>
                    </div>
                `;

                await sendEmail({
                    email: user.email,
                    subject: `🎟️ Your Tickets for ${event.title} are Confirmed!`,
                    html: emailHTML
                });
                console.log('✅ Receipt email sent successfully to:', user.email);
            }
        } catch (emailError) {
            // We use a separate try/catch here so if the email fails (e.g., bad wifi), 
            // the user still gets their ticket in the database!
            console.error('⚠️ Ticket saved, but failed to send email:', emailError.message);
        }
        // ==========================================

        // 7. Finally, tell the frontend it was a success!
        res.status(201).json({
            success: true,
            message: `Successfully booked ${quantity} ticket(s)!`,
            data: booking
        });

    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// 2. Get All Bookings for a Specific User
// ==========================================
const getUserBookings = async (req, res) => {
    try {
        const { userId } = req.params;

        // Find bookings matching the user ID, and 'populate' the event data!
        // ENHANCEMENT: Sorting by newest booking first
        const bookings = await Booking.find({ user: userId })
                                      .populate('event')
                                      .sort('-bookingDate');

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// 3. Get All Bookings for a Specific Event (The Guest List)
// ==========================================
const getEventBookings = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Find all bookings for this event and 'populate' the user data (name and email)
        const bookings = await Booking.find({ event: eventId })
                                      .populate('user', 'name email') // Grab the attendee's details!
                                      .sort('-createdAt'); // Newest first

        res.status(200).json({
            success: true,
            count: bookings.length,
            data: bookings
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// DON'T FORGET to update your exports at the very bottom!
module.exports = { createBooking, getUserBookings, getEventBookings };

// Export BOTH distinct functions
module.exports = { createBooking, getUserBookings,getEventBookings };