document.addEventListener('DOMContentLoaded', async () => {
    // 1. Grab the current user & token using our bulletproof Utils
    const currentUser = Utils.getUser();
    const token = Utils.getToken();
    
    if (!currentUser || !token) return;

    // 2. Update the UI Greeting & Avatar
    const greetingEl = document.getElementById('user-greeting');
    if (greetingEl) {
        const name = currentUser.name || 'User';
        greetingEl.textContent = `Welcome back, ${name}!`;
        document.querySelector('.avatar-circle').textContent = name.charAt(0).toUpperCase();
    }

    try {
        const userId = currentUser._id || currentUser.id;
        
        // 🚨 BULLETPROOF FIX: We bypass API.get and use raw fetch to guarantee the token is sent!
        const response = await fetch(`http://localhost:5001/api/v1/bookings/user/${userId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // ==========================================
    // STRIPE CONNECT: Link Bank Account Logic
    // ==========================================
    const linkBankBtn = document.getElementById('link-bank-btn');
    
    if (linkBankBtn) {
        linkBankBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Visual feedback
            const originalText = linkBankBtn.innerHTML;
            linkBankBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Securely Connecting...';
            linkBankBtn.disabled = true;

            try {
                // 🚨 Hit your protected backend route
                const response = await fetch('http://localhost:5001/api/v1/payments/onboard-host', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.error || "Failed to generate Stripe link");
                }

                // 🚀 Teleport the user to Stripe's secure banking portal!
                window.location.href = data.url;

            } catch (error) {
                console.error("Stripe Onboarding Error:", error);
                alert("Failed to connect to Stripe: " + error.message);
                linkBankBtn.innerHTML = originalText;
                linkBankBtn.disabled = false;
            }
        });
    }

    // ==========================================
    // WELCOME BACK FROM STRIPE
    // ==========================================
    // Check the URL to see if Stripe just sent them back
    const urlParams = new URLSearchParams(window.location.search);
    const stripeStatus = urlParams.get('stripe');

    if (stripeStatus === 'success') {
        // Clean the URL so they don't see the code
        window.history.replaceState({}, document.title, window.location.pathname);
        alert('✅ Bank account linked successfully! You are now ready to receive payouts.');
        
        // Hide the yellow warning box since they are onboarded!
        const warningBox = linkBankBtn?.closest('div[style*="border-left"]'); // Adjust if your warning box has a specific class
        if (warningBox) warningBox.style.display = 'none';
        
    } else if (stripeStatus === 'failed') {
        window.history.replaceState({}, document.title, window.location.pathname);
        alert('⚠️ Stripe connection was incomplete or cancelled. Please try again when you are ready.');
    }

        const responseData = await response.json();

        // Safely extract the array. The backend sends { success: true, data: [...] }
        const bookings = responseData.data || [];

        if (!Array.isArray(bookings)) {
            throw new Error("Failed to parse bookings array from backend!");
        }

        // 4. Calculate Total Bookings
        const totalBookingsEl = document.getElementById('total-bookings-count');
        if (totalBookingsEl) totalBookingsEl.textContent = bookings.length;

        // 5. Calculate "Upcoming" Events 
        const now = new Date();
        const upcomingBookings = bookings.filter(booking => {
            if (!booking.event) return false;
            const eventDate = new Date(booking.event.date);
            return eventDate > now;
        });
        
        const upcomingCountEl = document.getElementById('upcoming-events-count');
        if (upcomingCountEl) upcomingCountEl.textContent = upcomingBookings.length;

        // 6. Draw the Chart!
        renderChart(bookings);

    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
    }
});

// --- Chart.js Rendering Engine ---
const renderChart = (bookings) => {
    const ctx = document.getElementById('bookingChart');
    if (!ctx) return;

    // If they have no bookings, stop here
    if (bookings.length === 0) return;

    // Grab up to the 5 most recent bookings
    const recentBookings = bookings.slice(0, 5).reverse();

    const labels = recentBookings.map(b => b.event ? b.event.title : 'Deleted Event');
    const dataPoints = recentBookings.map(b => b.quantity);

    new Chart(ctx, {
        type: 'bar', // A clean bar chart
        data: {
            labels: labels,
            datasets: [{
                label: 'Tickets Booked',
                data: dataPoints,
                backgroundColor: 'rgba(0, 242, 254, 0.4)', // Neon Cyan transparent
                borderColor: '#00f2fe',                    // Neon Cyan border
                borderWidth: 2,
                borderRadius: 6                            // Rounded corners
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false, 
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { color: '#aaa', stepSize: 1 }, 
                    grid: { color: 'rgba(255,255,255,0.1)' }
                },
                x: {
                    ticks: { color: '#aaa' },
                    grid: { display: false }
                }
            },
            plugins: {
                legend: {
                    labels: { color: '#fff', font: { family: 'Inter, sans-serif' } }
                }
            }
        }
    });
};