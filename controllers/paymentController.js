const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Event = require('../models/EventModel');
const User = require('../models/UserModel'); 

const createCheckoutSession = async (req, res) => {
    try {
        const { eventId, userId, quantity } = req.body;

        const event = await Event.findById(eventId);
        if (!event) return res.status(404).json({ success: false, error: 'Event not found' });

        // Fetch the event organizer to see if they have a Stripe account connected
        const organizer = await User.findById(event.organizer);
        
        const totalAmount = Math.round(event.price * quantity * 100); // Total price in cents/paise
        const platformFee = Math.round(totalAmount * 0.10); // 10% platform cut

        // Base session configuration
        const sessionConfig = {
            payment_method_types: ['card', 'upi'],
            line_items: [
                {
                    price_data: {
                        currency: event.currency ? event.currency.toLowerCase() : 'inr',
                        product_data: {
                            name: event.title,
                            images: [event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30'],
                        },
                        unit_amount: Math.round(event.price * 100),
                    },
                    quantity: quantity,
                },
            ],
            mode: 'payment',
            metadata: { eventId, userId, quantity },
            
            // 🚨 FIX 1: Updated to port 5001 AND explicitly attached the event details!
            success_url: `https://candid-biscuit-01a852.netlify.app/my-bookings.html?success=true&event_id=${eventId}&quantity=${quantity}`,
            cancel_url: `https://nexus-events-backend.onrender.com/event-details.html?id=${eventId}`,
        };

        // THE AUTOMATED SPLIT LOGIC
        // If the host is onboarded, apply the 10% cut and route the rest to their ID
        if (organizer && organizer.stripeAccountId) {
            sessionConfig.payment_intent_data = {
                application_fee_amount: platformFee, // This drops into your wallet
                transfer_data: {
                    destination: organizer.stripeAccountId, // This goes straight to the host
                },
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);
        res.status(200).json({ success: true, url: session.url });

    } catch (error) {
        console.error("Stripe Checkout Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

// ==========================================
// Onboard Host (Generate Stripe Connect Link)
// ==========================================
const onboardHost = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id || req.userId;
        
        let user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, error: 'User not found' });

        let stripeAccountId = user.stripeAccountId;

        // 1. If the user doesn't have a Stripe account yet, create an Express account for them
        if (!stripeAccountId) {
            const account = await stripe.accounts.create({
                type: 'express',
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });
            stripeAccountId = account.id;
            user.stripeAccountId = stripeAccountId;
            await user.save();
        }

        // 🚨 FIX 2: Updated the Dashboard return links to port 5001
        const accountLink = await stripe.accountLinks.create({
            account: stripeAccountId,
            refresh_url: 'https://nexus-events-backend.onrender.com/dashboard.html?stripe=failed',
            return_url: 'https://nexus-events-backend.onrender.com/dashboard.html?stripe=success',
            type: 'account_onboarding',
        });

        res.status(200).json({ success: true, url: accountLink.url });

    } catch (error) {
        console.error("Stripe Onboarding Error:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { createCheckoutSession, onboardHost };