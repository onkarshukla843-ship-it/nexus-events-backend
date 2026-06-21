const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Event = require('../models/EventModel'); // Double check this matches your exact Event model filename!
const User = require('../models/UserModel');

router.post('/create-checkout-session', async (req, res) => {
    try {
       const { eventId, userId, quantity } = req.body;
        // 1. Fetch the event from the database to verify the actual price
        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        // 2. Stripe expects amounts in cents (e.g., $25.00 = 2500 cents)
        const priceInCents = Math.round(event.price * 100);




// ... (fetch event logic remains the same)

const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'upi'],
    line_items: [
        {
            price_data: {
                currency: 'usd',
                product_data: {
                    name: event.title,
                    description: event.description,
                    images: [event.imageUrl],
                },
                unit_amount: priceInCents,
            },
            quantity: quantity || 1, // Use the passed quantity, default to 1
        },
    ],
    // ... (rest of the code)
            mode: 'payment',
            // Pass custom metadata so we know who bought what after successful payment
            metadata: {
                eventId: eventId,
                userId: userId
            },
            // Replace your success_url line with this:
success_url: `${process.env.FRONTEND_URL}/my-bookings.html?success=true&event_id=${eventId}&quantity=${quantity || 1}`,
            cancel_url: `${process.env.FRONTEND_URL}/frontend/events.html?canceled=true`,
        });

        // 4. Send the session URL back to the frontend
        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe Session Error:', error);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
    }
});

// ==========================================
// CONNECT: Generate Host Onboarding Link
// ==========================================
router.post('/onboard-host', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let accountId = user.stripeAccountId;

        // 1. If they don't have a Stripe Account yet, create an empty one
        if (!accountId) {
            const account = await stripe.accounts.create({
                type: 'express', // 'express' is the standard for marketplaces like yours
                country: 'US', // Assuming hosts are in India. Change to 'US' if needed.
                email: user.email,
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });
            accountId = account.id;
            
            // Save this new ID to your database
            user.stripeAccountId = accountId;
            await user.save();
        }

        // 2. Generate the secure Stripe setup link
        const accountLink = await stripe.accountLinks.create({
            account: accountId,
            refresh_url: `${process.env.FRONTEND_URL}/profile.html`,
            return_url: `${process.env.FRONTEND_URL}/profile.html?onboarded=true`,
            type: 'account_onboarding',
        });

        // 3. Send the link back to the frontend
        res.status(200).json({ url: accountLink.url });

    } catch (error) {
    // This will print ONLY the readable message, not the massive block!
    console.error('🚨 Stripe Error Message:', error.message); 
    res.status(500).json({ error: error.message });
}
});
// ==========================================
// LOGIN LINK: Let connected hosts view dashboard
// ==========================================
router.post('/login-link', async (req, res) => {
    try {
        const { userId } = req.body;
        const user = await User.findById(userId);

        if (!user || !user.stripeAccountId) {
            return res.status(400).json({ error: "Stripe account not found for this user." });
        }

        // Generate a unique single-use login link to Stripe Express dashboard
        const loginLink = await stripe.accounts.createLoginLink(user.stripeAccountId);
        
        res.status(200).json({ url: loginLink.url });
    } catch (error) {
        console.error('🚨 Dashboard Link Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// ==========================================
// TICKET CHECKOUT: Buy a Ticket & Split Payment
// ==========================================
router.post('/create-checkout-session', async (req, res) => {
    try {
        // We will send these details from the frontend when the user clicks "Buy"
        const { eventId, eventTitle, ticketPrice, hostStripeAccountId } = req.body;

        if (!hostStripeAccountId) {
            return res.status(400).json({ error: "This host cannot receive payments yet." });
        }

        // Stripe calculates money in the smallest currency unit (e.g., cents or paise)
        // So $10.00 (or ₹10.00) becomes 1000
        const unitAmount = Math.round(ticketPrice * 100);
        
        // Let's take a 10% platform fee for Nexus Events!
        const platformFee = Math.round(unitAmount * 0.10); 

        // Generate the Stripe Checkout Page
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'inr', // Change to 'usd' if you prefer testing in dollars
                        product_data: {
                            name: `Ticket: ${eventTitle}`,
                        },
                        unit_amount: unitAmount,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            // Where to send the user after they pay
            success_url: `https://candid-biscuit-01a852.netlify.app/my-bookings.html?success=true&event_id=${event_id}&quantity=${quantity}`,
            cancel_url: `https://candid-biscuit-01a852.netlify.app/event-details.html?id=${event_id}`,
            
            // 🚨 THE MAGIC SAUCE: Splitting the payment! 🚨
            payment_intent_data: {
                application_fee_amount: platformFee, // Your 10% cut
                transfer_data: {
                    destination: hostStripeAccountId, // The Host's 90% cut
                },
            },
        });

        // Send the checkout URL back to the frontend
        res.status(200).json({ url: session.url });

    } catch (error) {
        console.error('🚨 Checkout Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;