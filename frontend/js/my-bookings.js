document.addEventListener('DOMContentLoaded', () => {
    const bookingsGrid = document.getElementById('bookings-grid');
    if (bookingsGrid) {
        loadMyBookings();
    }
    checkPaymentSuccess();
});

const checkPaymentSuccess = async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const isSuccess = urlParams.get('success');
    const eventId = urlParams.get('event_id');
    const quantity = urlParams.get('quantity');
    
    if (isSuccess === 'true' && eventId) {
        try {
            const currentUser = Utils.getUser();
            const token = Utils.getToken();
            
            console.log("Attempting to save booking to database...");

            const response = await fetch('http://localhost:5001/api/v1/bookings', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    eventId: eventId,
                    userId: currentUser._id || currentUser.id,
                    quantity: parseInt(quantity) || 1
                })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                // 🚨 This will instantly tell us WHY the backend rejected the ticket
                throw new Error(data.error || data.message || "Backend rejected the booking save.");
            }

            // Only clean the URL if the save was actually successful!
            window.history.replaceState({}, document.title, window.location.pathname);
            
            alert('🎉 Payment Successful! Your ticket has been generated.');
            window.location.reload(); 
            
        } catch (error) {
            // 🚨 We will see this in the Console if it fails!
            console.error('❌ Failed to save booking:', error);
            alert("Payment cleared, but there was an error generating your ticket. Please check console.");
        }
    }
};

const loadMyBookings = async () => {
    const bookingsGrid = document.getElementById('bookings-grid');
    const loader = document.getElementById('bookings-loader');
    const emptyState = document.getElementById('no-bookings-state');

    if (bookingsGrid) bookingsGrid.innerHTML = '';

    const currentUser = Utils.getUser();
    const token = Utils.getToken();
    if (!currentUser || !token) return;

    const userId = currentUser._id || currentUser.id;

    try {
        const response = await fetch(`http://localhost:5001/api/v1/bookings/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();
        const bookings = responseData.data || [];
        
        // 🚨 DEVELOPER SPY: Let's see exactly what the database is sending us!
        console.log("RAW BOOKINGS DATA:", bookings);

        if (loader) loader.style.display = 'none';

        if (!bookings || bookings.length === 0) {
            if (emptyState) {
                emptyState.style.display = 'block';
                emptyState.classList.remove('hidden');
            }
            return;
        }

        let html = '';
        
        // Loop through tickets safely
        bookings.forEach(booking => {
            try {
                const event = booking.event || booking.eventId; 
                if (!event || !event.title) return; // Skip broken records

                const eventDate = new Date(event.date).toLocaleDateString('en-US', {
                    year: 'numeric', month: 'long', day: 'numeric'
                });
                
                // Format the price using our new dynamic currency tool!
                const totalPaid = Utils.formatCurrency(booking.totalAmount, event.currency);

                html += `
                    <article class="event-card glass-card" style="display: flex; gap: 20px; padding: 20px; align-items: center; position: relative; margin-bottom: 20px;">
                        
                        <div style="position: absolute; top: 20px; right: 20px; background: rgba(40, 167, 69, 0.1); color: #28a745; padding: 6px 16px; border-radius: 20px; font-size: 0.85rem; font-weight: 600; border: 1px solid rgba(40, 167, 69, 0.3);">
                            <i class="fas fa-check-circle" style="margin-right: 5px;"></i> Confirmed
                        </div>

                        <div style="flex-shrink: 0; width: 120px; height: 120px; border-radius: 15px; overflow: hidden;">
                            <img src="${event.imageUrl || 'https://images.unsplash.com/photo-1540575467063-178a50c2df87'}" alt="Event" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800'">
                        </div>
                        <div style="flex-grow: 1; padding-right: 120px;">
                            <h3 style="margin-bottom: 5px; color: #00f2fe; text-transform: capitalize; font-size: 1.4rem;">${event.title}</h3>
                            <p style="color: #aaa; margin-bottom: 5px;"><i class="fas fa-calendar" style="margin-right: 8px;"></i> ${eventDate}</p>
                            <p style="color: #aaa; margin-bottom: 15px;"><i class="fas fa-map-marker-alt" style="margin-right: 8px;"></i> ${event.location}</p>
                            
                            <div style="display: flex; gap: 15px;">
                                <span style="background: rgba(0,242,254,0.1); color: #00f2fe; padding: 6px 15px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                                    <i class="fas fa-ticket-alt" style="margin-right: 5px;"></i> ${booking.quantity || 1} Ticket(s)
                                </span>
                                <span style="background: rgba(255,255,255,0.05); color: #fff; padding: 6px 15px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                                    Total Paid: ${totalPaid}
                                </span>
                            </div>
                        </div>
                    </article>
                `;
            } catch (ticketError) {
                console.warn("Skipping a corrupted ticket:", ticketError);
            }
        });

        bookingsGrid.innerHTML = html;

    } catch (error) {
        console.error('Failed to load bookings:', error);
        if (loader) loader.style.display = 'none';
        if (bookingsGrid) bookingsGrid.innerHTML = `<p style="color: #ff4d4d; padding: 20px;">Error loading tickets.</p>`;
    }
};