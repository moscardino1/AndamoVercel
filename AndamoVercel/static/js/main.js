
let map;
let markers = [];
let locations = [];
const iconConfig = {
    Food: "red",
    Drinks: "green",
    Breakfast: "yellow",
    Museum: "blue",
    Park: "orange",
    Shop: "grey",
    Beach: "violet",
};

// Updated marker icon configuration
function createIcon(color) {
    return L.icon({
        iconUrl: `https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-2x-${color}.png`,
        shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}


const icons = {};
for (const [type, color] of Object.entries(iconConfig)) {
    icons[type] = createIcon(color);
}

// Function to get the marker icon based on the location type
function getMarkerIcon(type) {
    return icons[type] || createIcon('black'); // Use a default 'gray' icon if the type is not found
}
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
            const markerIcon = getMarkerIcon(location.type); // Get the icon based on the location type
        
            const leafletMarker = L.marker([location.latitude, location.longitude], { icon: markerIcon })
                .bindPopup(createPopupContent(location))
                .addTo(map);
        
            // Ensure popups work on marker click
            leafletMarker.on('click', () => {
                leafletMarker.openPopup();
                highlightListItem(location.address); // Ensure the corresponding list item is highlighted
            });
        
            markers.push(leafletMarker); // Store the Leaflet marker in the markers array
        });
        

        map.fitBounds(bounds.pad(0.2)); // Adjust padding for better fit
    } else {
        map.setView([0, 0], 2); // Default view if no locations match
    }
}

function highlightListItem(locationId) {
    const listItem = document.querySelector(`[data-id="${locationId}"]`);
    if (listItem) {
        // Remove highlight from all list items
        document.querySelectorAll('.location-card').forEach(item => item.classList.remove('highlighted'));

        // Highlight the current list item
        listItem.classList.add('highlighted');

        // Scroll to the list item
        listItem.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}


// Function to focus on a location
function focusLocation(lat, lng) {
    map.setView([lat, lng], 20);
    // Find and open the corresponding marker's popup
    markers.forEach(marker => {
        if (marker.getLatLng().lat === lat && marker.getLatLng().lng === lng) {
            setTimeout(() => {
                marker.openPopup();
            }, 1);
                    }
    });
}
// Updated list content creation
function updateList(searchText = '', city = '', type = '') {
    const locationsList = document.getElementById('locationsList');
    const filteredLocations = filterLocations(searchText, city, type);

    locationsList.innerHTML = filteredLocations.map(location => `
        <div class="location-card" data-id="${location.address}">
            <div class="location-image">
                ${location.image ? 
                    `<img src="${location.image}" alt="${location.name}">` : 
                    `<div class="placeholder-image"><i class="fa fa-picture-o"></i></div>`
                }
            </div>
            <div class="location-info">
                <h3 class="location-name" onclick="focusLocation(${location.latitude}, ${location.longitude})">${location.name}</h3>
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}" 
                   class="location-address" target="_blank" rel="noopener noreferrer">
                    ${location.address}
                </a>
                <p class="location-type">${location.type}</p>
            </div>
        </div>
    `).join('');
    
}



// Updated popup content creation
function createPopupContent(location) {
    return `
        <div class="popup-content">
            ${location.image ? `<img src="${location.image}" alt="${location.name}" class="popup-image">` : ''}
            <h3>${location.name.replace(/'/g, "&#39;")}</h3>
            <p class="popup-address">
                <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location.address)}" 
                   target="_blank" rel="noopener noreferrer">
                    ${location.address}
                </a>
            </p>
            <p class="popup-type"><strong>${location.type}</strong></p>
            <p class="popup-description">${location.description}</p>
        </div>
    `;
}
 

// Initialize map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    map = L.map('map');
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

 

    // Fetch locations data
    fetchLocations();
    

            
    
});
