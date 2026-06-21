const Utils = {
    // 1. Safely grab the token
    getToken: () => {
        return localStorage.getItem('token');
    },

    // 2. Safely grab and parse the user data
    getUser: () => {
        const userStr = localStorage.getItem('user');
        if (!userStr || userStr === "undefined") {
            return null;
        }
        try {
            return JSON.parse(userStr);
        } catch (e) {
            console.error("Error parsing user data:", e);
            return null;
        }
    },

    // 3. Clean logout function
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    },

    // 🚨 RESTORED: The authentication checker that your older scripts are looking for!
    isAuthenticated: () => {
        const token = localStorage.getItem('token');
        return !!token; // Returns true if token exists, false otherwise
    },

    // 🚨 RESTORED: The currency formatter that your HTML files need to draw the prices!
    formatCurrency: (amount, currencyCode = 'USD') => {
        if (amount === undefined || amount === null) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode.toUpperCase() // Will use INR, USD, EUR, etc.
        }).format(amount);
    }
};

// Global protection: Automatically kick out if trying to access a secure page without a token
document.addEventListener('DOMContentLoaded', () => {
    const isAuthPage = window.location.pathname.includes('login.html') || window.location.pathname.includes('register.html') || window.location.pathname.includes('index.html') || window.location.pathname === '/';
    
    if (!isAuthPage) {
        const token = Utils.getToken();
        const user = Utils.getUser();
        
        if (!token || !user) {
            console.warn("Security check failed. Redirecting to login.");
            Utils.logout(); // Clears any corrupted data and kicks to login
        }
    }
});