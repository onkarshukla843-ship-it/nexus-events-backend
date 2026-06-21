document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('nexusLoginForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault(); 
            
            const email = document.getElementById('loginEmail').value;
            const password = document.getElementById('loginPassword').value;
            const btn = document.getElementById('loginBtn');
            const btnText = document.getElementById('loginBtnText');
            const errorDiv = document.getElementById('authError');

            errorDiv.style.display = 'none';
            btn.disabled = true;
            btnText.textContent = 'Authenticating...';

            try {
                const response = await fetch('https://nexus-events-backend.onrender.com/api/v1/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();
                
                // 🚨 DEVELOPER SPY: This will print EXACTLY what the backend sends us
                console.log("BACKEND PAYLOAD:", data);

                if (response.ok) {
                    // 1. Hunt down the token wherever the backend hid it
                    const finalToken = data.token || (data.data && data.data.token) || data.accessToken;
                    
                    // 2. Hunt down the user, or fake a valid ID card just to bypass the bouncer!
                    const finalUser = data.user || data.data || { name: 'Nexus Host', email: email };
                    
                    if (!finalToken) {
                        throw new Error("Login succeeded, but no token was received from the server!");
                    }

                    // Save the VIP Pass to memory
                    localStorage.setItem('token', finalToken);
                    localStorage.setItem('user', JSON.stringify(finalUser));
                    
                    btnText.textContent = 'Success!';
                    
                    // Add a tiny half-second delay so the browser can securely write to memory
                    setTimeout(() => {
                        window.location.href = 'dashboard.html'; 
                    }, 500);
                    
                } else {
                    throw new Error(data.message || 'Invalid credentials');
                }
            } catch (err) {
                errorDiv.textContent = err.message;
                errorDiv.style.display = 'block';
                btn.disabled = false;
                btnText.textContent = 'Log In';
            }
        });
    }
});