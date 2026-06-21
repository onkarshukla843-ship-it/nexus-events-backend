/**
 * auth.js
 * Enhanced and Consolidated Authentication Controller
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Global Page Protection (The Bouncer) ---
    const protectedPages = ['dashboard.html', 'create-event.html', 'my-bookings.html', 'profile.html', 'edit-event.html'];
    const currentPage = window.location.pathname.split('/').pop(); 
    
    if (protectedPages.includes(currentPage) && !Utils.isAuthenticated()) {
        window.location.href = 'login.html';
        return; // Halt further execution for private pages
    }

    // --- 2. Dynamic Navbar & UI Sync ---
    // --- 2. Dynamic Navbar & UI Sync ---
    const updateNavbar = () => {
        const user = Utils.getUser();
        const navAuth = document.getElementById('nav-auth-container') || document.querySelector('.nav-auth');
        
        if (!navAuth) return;

        if (user) {
            // Logged In State (Restored your original Welcome message!)
            navAuth.innerHTML = `
                <div class="user-profile-pill" style="display:flex; align-items:center; gap:10px; cursor: pointer;" onclick="window.location.href='dashboard.html'">
                    <i class="fas fa-user-circle pill-icon" style="font-size: 1.5rem; color: var(--neon-blue);"></i>
                    <span class="pill-text" style="color: white;">
                        Welcome, <strong class="pill-name">${user.name || 'User'}</strong>
                    </span>
                </div>
            `;
            
            // Un-hide Dashboard tabs (if they exist)
            document.querySelectorAll('.nav-dashboard').forEach(tab => tab.classList.remove('auth-hidden'));
        } else {
            // Logged Out State
            navAuth.innerHTML = `
                <a href="login.html" class="btn btn-outline">Log In</a>
                <a href="register.html" class="btn btn-neon">Sign Up</a>
            `;
        }
    };
    updateNavbar();

    // --- 3. Login Form Handler ---
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            Utils.showLoader('login-btn');
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                const response = await API.post('/auth/login', { email, password });
                
                // Use the enhanced Utils
                Utils.setToken(response.token);
                Utils.setUser(response.user);
                
                window.location.href = 'dashboard.html';
            } catch (error) {
                Utils.showMessage('auth-error-message', error.message || 'Login failed', 'error');
            } finally {
                Utils.hideLoader('login-btn');
            }
        });
    }

    // --- 4. Registration Form Handler ---
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const terms = document.getElementById('terms')?.checked;

            if (password !== confirmPassword) return Utils.showMessage('auth-error-message', 'Passwords do not match.', 'error');
            if (!terms) return Utils.showMessage('auth-error-message', 'Please agree to the Terms.', 'error');

            Utils.showLoader('register-btn');
            try {
                const response = await API.post('/auth/register', { name, email, password });
                Utils.setToken(response.token);
                Utils.setUser(response.user);
                window.location.href = 'dashboard.html';
            } catch (error) {
                Utils.showMessage('auth-error-message', error.message, 'error');
            } finally {
                Utils.hideLoader('register-btn');
            }
        });
    }

    // --- 5. Global Logout Handler (Wire up ANY button with id="logout-btn") ---
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Use your enhanced logout method
            Utils.logout(); 
        });
    }
});