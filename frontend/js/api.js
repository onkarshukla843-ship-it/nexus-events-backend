/**
 * api.js
 * Core service for handling all fetch requests to the Node.js backend.
 */

// This points to our future backend server port
const API_BASE_URL = 'https://nexus-events-backend.onrender.com/api/v1'; 

const API = {
    /**
     * Master request handler
     */
    async request(endpoint, options = {}) {
        const token = Utils.getToken();
        
        // Setup default headers
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        // Inject JWT Token for protected routes
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        // If uploading files (Multer), browser must set Content-Type automatically with boundary
        if (options.body instanceof FormData) {
            delete headers['Content-Type'];
        }

        try {
            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                ...options,
                headers
            });
            
            const data = await response.json();
            
            // Handle HTTP Errors globally
            if (!response.ok) {
                // If token is expired or invalid, force logout
                if (response.status === 401) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    window.location.href = 'login.html';
                }
                throw new Error(data.message || 'An error occurred during the request.');
            }
            
            return data;
        } catch (error) {
            console.error(`[API Error] ${endpoint}:`, error);
            throw error;
        }
    },

    // --- Helper Methods ---
    get: (endpoint) => API.request(endpoint, { method: 'GET' }),
    
    post: (endpoint, body) => API.request(endpoint, { 
        method: 'POST', 
        body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
    put: (endpoint, body) => API.request(endpoint, { 
        method: 'PUT', 
        body: body instanceof FormData ? body : JSON.stringify(body) 
    }),
    
    delete: (endpoint) => API.request(endpoint, { method: 'DELETE' })
};