/**
 * main.js
 * Handles global UI interactions, mobile menus, and scroll effects.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Mobile Hamburger Menu Toggle ---
    const hamburger = document.getElementById('hamburger-menu');
    const navLinks = document.querySelector('.nav-links');
    const navAuth = document.querySelector('.nav-auth') || document.getElementById('nav-auth-container');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            if (navAuth) navAuth.classList.toggle('active');
            
            // Toggle icon between bars and close (X)
            const icon = hamburger.querySelector('i');
            if (icon.classList.contains('fa-bars')) {
                icon.classList.replace('fa-bars', 'fa-times');
            } else {
                icon.classList.replace('fa-times', 'fa-bars');
            }
        });
    }

    // --- 2. Glassmorphism Navbar Scroll Effect ---
    const navbar = document.getElementById('navbar');
    
    if (navbar) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 50) {
                navbar.style.background = 'rgba(5, 5, 7, 0.85)'; // Darker glass
                navbar.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.5)';
                navbar.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
            } else {
                navbar.style.background = 'var(--glass-bg)'; // Transparent glass
                navbar.style.boxShadow = 'none';
                navbar.style.borderBottom = 'none';
            }
        });
    }
});

window.connectStripe = async () => {
    try {
        const currentUser = Utils.getUser();
        if (!currentUser) return alert("Please log in first.");

        // 🚨 Change the text of the button so the user knows it is loading
        const btn = document.querySelector('button[onclick="connectStripe()"]');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
        btn.disabled = true;

        // Call our backend to get the secure Stripe URL
        const response = await API.post('/payments/onboard-host', {
            userId: currentUser._id || currentUser.id
        });

        // Redirect the user to Stripe!
        if (response && response.data && response.data.url) {
            window.location.href = response.data.url;
        } else if (response && response.url) {
            window.location.href = response.url;
        } else {
            throw new Error("No URL returned from server");
        }

    } catch (error) {
        console.error("Failed to connect Stripe:", error);
        alert("Could not start bank setup. Please make sure your backend is running.");
        
        // Reset the button if it fails
        const btn = document.querySelector('button[onclick="connectStripe()"]');
        if(btn) {
            btn.innerHTML = 'Connect Bank Account';
            btn.disabled = false;
        }
    }
};