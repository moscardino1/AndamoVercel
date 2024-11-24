let map;
let markers = [];
let locations = [];

async function fetchLocations() {
    try {
        const response = await fetch('/api/locations');
        const result = await response.json();

        if (result.status === 'success' && Array.isArray(result.data)) {
            locations = result.data;
            console.log('Fetched locations:', locations);
        } else {
            console.warn('Invalid data format received:', result);
            locations = [];
        }

        updateMap();
        updateList();
        setupFilters();
    } catch (error) {
        console.error('Error fetching locations:', error);
        locations = [];

        const locationsList = document.getElementById('locationsList');
        if (locationsList) {
            locationsList.innerHTML = `
                <div class="error-message">
                    <p>Error loading locations. Please try again later.</p>
                </div>
            `;
        }
    }
}

function setupFilters() {
    const citySelect = document.getElementById('cityFilter');
    const typeSelect = document.getElementById('typeFilter');
    const searchInput = document.getElementById('searchInput');

    // Get unique cities and types
    const cities = [...new Set(locations.map(loc => loc.city))].sort();
    const types = [...new Set(locations.map(loc => loc.type))].sort();

    // Populate city filter
    citySelect.innerHTML = '<option value="">All Cities</option>';
    cities.forEach(city => {
        if (city) {
            const option = document.createElement('option');
            option.value = city;
            option.textContent = city;
            citySelect.appendChild(option);
        }
    });

    // Populate type filter
    typeSelect.innerHTML = '<option value="">All Types</option>';
    types.forEach(type => {
        if (type) {
            const option = document.createElement('option');
            option.value = type;
            option.textContent = type;
            typeSelect.appendChild(option);
        }
    });

    // Add event listeners
    citySelect.addEventListener('change', updateFilters);
    typeSelect.addEventListener('change', updateFilters);
    searchInput.addEventListener('input', updateFilters);
}

function updateFilters() {
    const searchText = document.getElementById('searchInput').value;
    const city = document.getElementById('cityFilter').value;
    const type = document.getElementById('typeFilter').value;

    updateMap(searchText, city, type);
    updateList(searchText, city, type);
}

function filterLocations(searchText = '', city = '', type = '') {
    return locations.filter(location => {
        const matchSearch = !searchText ||
            location.name.toLowerCase().includes(searchText.toLowerCase()) ||
            location.description.toLowerCase().includes(searchText.toLowerCase());
        const matchCity = !city || location.city === city;
        const matchType = !type || location.type === type;
        return matchSearch && matchCity && matchType;
    });
}




function updateMap(searchText = '', city = '', type = '') {
    // Clear existing markers
    markers.forEach(marker => marker.remove());
    markers = [];

    const filteredLocations = filterLocations(searchText, city, type);

    if (filteredLocations.length > 0) {
        const bounds = L.latLngBounds(filteredLocations.map(location => [location.latitude, location.longitude]));

        filteredLocations.forEach(location => {
            const marker = L.marker([location.latitude, location.longitude])
                .bindPopup(createPopupContent(location))
                .addTo(map);

            marker.on('click', () => showLocationDetails(location));
            markers.push(marker);
        });

        map.fitBounds(bounds.pad(0.2)); // Adjust padding for better fit
    } else {
        map.setView([0, 0], 2); // Default view if no locations match
    }
}



function updateList(searchText = '', city = '', type = '') {
    const locationsList = document.getElementById('locationsList');
    const filteredLocations = filterLocations(searchText, city, type);

    locationsList.innerHTML = filteredLocations.map(location => `
        <div class="location-card" onclick="showLocationDetails(${JSON.stringify(location).replace(/"/g, '&quot;')})">
            <h3>${location.name}</h3>
            <p>${location.address}</p>
            <p class="location-type">${location.type}</p>
        </div>
    `).join('');

    // Ensure the list is scrollable
    locationsList.style.overflowY = 'auto';
    locationsList.style.maxHeight = '500px'; // You can adjust the height as needed
}

function createPopupContent(location) {
    return `
        <div class="popup-content">
            <h3>${location.name}</h3>
            <p>${location.address}</p>
            <p><strong>${location.type}</strong></p>
            <button onclick='showLocationDetails(${JSON.stringify(location).replace(/"/g, '&quot;')})'>
                More Details
            </button>
        </div>
    `;
}

function showLocationDetails(location) {
    const modal = document.getElementById('locationModal');
    const modalContent = document.getElementById('modalContent');

    modalContent.innerHTML = `
        <h2>${location.name}</h2>
        <p><strong>Address:</strong> ${location.address}</p>
        <p><strong>Type:</strong> ${location.type}</p>
        <p><strong>Description:</strong> ${location.description}</p>
        ${location.image ? `<img src="${location.image}" alt="${location.name}" class="modal-image">` : ''}
    `;

    modal.style.display = 'block';
}

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Close modal when clicking the close button
    document.querySelector('.close').addEventListener('click', () => {
        document.getElementById('locationModal').style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        const modal = document.getElementById('locationModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Fetch locations data
    fetchLocations();
});
