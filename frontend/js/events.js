// Global memory to hold all events
let allEvents = [];

// ==========================================
// Helper: Logic to check ownership
// ==========================================
const checkIsOrganizer = (event) => {
    const user = Utils.getUser();
    if (!user || !event.organizer) return false;
    
    // Handle if organizer is a populated object or just a string ID
    const organizerId = (typeof event.organizer === 'object' && event.organizer !== null) 
                        ? event.organizer._id 
                        : event.organizer;
                        
    return String(user._id) === String(organizerId) || String(user.id) === String(organizerId);
};

// ==========================================
// 1. Fetch Events from Backend
// ==========================================
const loadEvents = async () => {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;

    // UX: Show loading state
    eventsContainer.innerHTML = '<div class="loader" style="text-align: center;">Loading events...</div>';

    try {
        const response = await fetch('http://localhost:5001/api/v1/events', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const responseData = await response.json();

        // Handle both simple arrays and object wrappers
        allEvents = responseData.data || responseData || [];
        renderEvents(allEvents);

    } catch (error) {
        console.error('Failed to load events:', error);
        eventsContainer.innerHTML = '<p class="error-text" style="color: #ff4d4d; text-align: center;">Failed to load events. Please try again later.</p>';
    }
};

// ==========================================
// 2. Draw Events on Screen
// ==========================================
const renderEvents = (events) => {
    const eventsContainer = document.getElementById('events-container');
    if (!eventsContainer) return;

    if (!events || events.length === 0) {
        eventsContainer.innerHTML = '<p style="text-align: center; width: 100%; color: #aaa;">No events found matching your criteria.</p>';
        return;
    }

    eventsContainer.innerHTML = events.map(event => {
        const isOrganizer = checkIsOrganizer(event);
        const eventDate = new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        
        const displayPrice = Utils.formatCurrency(event.price, event.currency);
        
        const fallbackImage = 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=800';
        const imageUrl = event.imageUrl || fallbackImage;

        return `
            <article class="event-card glass-card" data-aos="fade-up">
                <div class="card-image">
                    <img src="${imageUrl}" alt="${event.title}" loading="lazy" onerror="this.src='${fallbackImage}'">
                    <div class="category-badge glass-pill">${event.category || 'General'}</div>
                </div>
                <div class="card-content">
                    <h3 style="text-transform: capitalize;">${event.title}</h3>
                    <p class="event-date"><i class="fas fa-calendar"></i> ${eventDate}</p>
                    <p class="event-location"><i class="fas fa-map-marker-alt"></i> ${event.location}</p>
                    
                    <div class="card-footer">
                        <span class="price" style="color: #00f2fe; font-weight: bold; font-size: 1.2rem;">${displayPrice}</span>
                        
                        <div class="button-group">
                            <a href="event-details.html?id=${event._id}" class="btn btn-outline">Details</a>
                            ${isOrganizer ? `
                                <a href="guest-list.html?id=${event._id}" class="btn btn-outline" style="border-color: #10b981; color: #10b981; background: rgba(16, 185, 129, 0.1);">
                                    <i class="fas fa-users"></i> Guests
                                </a>
                                <a href="edit-event.html?id=${event._id}" class="btn btn-edit">Edit</a>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </article>
        `;
    }).join('');
};

// ==========================================
// 3. Filters & Initialization
// ==========================================
const applyFilters = () => {
    const searchText = document.getElementById('search-input')?.value.toLowerCase() || '';
    const category = document.getElementById('category-filter')?.value || 'all';

    const filteredEvents = allEvents.filter(event => {
        const matchesSearch = event.title.toLowerCase().includes(searchText) || 
                              event.location.toLowerCase().includes(searchText);
        const matchesCategory = category === 'all' || event.category === category;
        return matchesSearch && matchesCategory;
    });

    renderEvents(filteredEvents);
};

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();
    
    // Listeners
    document.getElementById('search-input')?.addEventListener('input', applyFilters);
    document.getElementById('category-filter')?.addEventListener('change', applyFilters);
});