// Identify unique DataType values
const uniqueDataTypes = [...new Set(locations.map(loc => loc.DataType))];

// Generate a color scale using d3.js
const colorScale = d3.scaleOrdinal(d3.schemeCategory10); // You can use other color schemes like d3.schemePaired, d3.schemeSet3, etc.

// Map each DataType to a color from the color scale
const colorScheme = uniqueDataTypes.reduce((acc, dataType, index) => {
    acc[dataType] = colorScale(index);  // Assign color based on index
    return acc;
}, {});

// Group locations by DataType
const groupedLocations = locations.reduce((groups, loc) => {
    if (!groups[loc.DataType]) {
        groups[loc.DataType] = [];
    }
    groups[loc.DataType].push(loc);
    return groups;
}, {});

// Initialize the Leaflet map
const Australia_Coordinates = [-25.2744, 133.7751];
const map = L.map('map', {
    zoomControl: false // This disables the default zoom controls
}).setView(Australia_Coordinates, 5); // Set initial map view (latitude, longitude, zoom level)


// Set the map tile layer (using Esri World Imagery)
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoIQ, Getmapping, and others'
}).addTo(map);

// Create a separate MarkerCluster group for each DataType
const dataTypeGroups = {};  // To store each MarkerCluster group by DataType
Object.keys(groupedLocations).forEach((dataType) => {
    const color = colorScheme[dataType];  // Get the color for the current DataType

    // Create a MarkerCluster group for the current DataType
    const markers = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
            const childCount = cluster.getChildCount();
            const zoomLevel = map.getZoom(); // Get current zoom level

            // Minimum size for clusters (same as individual marker size)
            const minClusterSize = 20;

            // Dynamically scale cluster size based on child count and zoom level
            // let clusterSize = 1.3 * minClusterSize + Math.log(childCount) * 4; // Start from min size and scale up
            let clusterSize = 1.3 * minClusterSize + childCount * 0.75; // Start from min size and scale up

            clusterSize = Math.max(clusterSize, minClusterSize); // Ensure cluster size doesn't go below individual marker size

            // Cap the size to a maximum value (e.g., 50px for larger clusters)
            clusterSize = Math.min(clusterSize, 60);

            // Set opacity for clusters
            return new L.DivIcon({
                html: `<div class="cluster-icon" style="background-color:${color}; width:${clusterSize}px; height:${clusterSize}px;">${childCount}</div>`,
                className: 'leaflet-marker-cluster',
                iconSize: new L.Point(clusterSize, clusterSize)
            });
        }
    });

    groupedLocations[dataType].forEach((loc) => {
        const marker = L.marker([loc.Latitude, loc.Longitude], {
            icon: L.divIcon({
                className: 'custom-marker',
                html: `<div class="marker-icon" style="background-color:${color};"></div>`
            })
        });

        // Bind a popup to each marker
        marker.bindPopup(`
            <i>${loc.DataType}</i><br>
            <b>Location: </b>${loc.Name}<br>
            (${loc.Latitude}°N, ${loc.Longitude}°E)
        `);

        // Bind a tooltip to show on hover
        marker.bindTooltip(`
            <i>${loc.DataType}</i><br>
            <b>Location: </b>${loc.Name}<br>
            (${loc.Latitude}°N, ${loc.Longitude}°E)
        `, {
            permanent: false,  // Tooltip is not permanent
            direction: 'top',  // Show tooltip above the marker
            offset: L.point(0, -10)  // Adjust the tooltip position
        });

        // Open URL on click (note: `loc.URL` instead of `loc.url`)
        marker.on('click', () => {
            if (loc.URL) {
                window.open(loc.URL, '_blank');
            }
        });

        // Add marker to the marker cluster for this DataType
        markers.addLayer(marker);
    });

    // Store the MarkerCluster group for this DataType
    dataTypeGroups[dataType] = markers;

    // Add the MarkerCluster group for this DataType to the map
    map.addLayer(markers);
});

// Handle loading spinner (when markers are loaded)
document.getElementById('loading-spinner').style.display = 'block';

// Optionally: You can create a custom legend for the map
const legend = L.control({ position: 'topright' });

legend.onAdd = function() {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '<b>Data Types</b><br>';
    uniqueDataTypes.forEach((dataType) => {
        div.innerHTML += `<span class="legend-color" style="background-color:${colorScheme[dataType]}"></span>${dataType}<br>`;
    });
    return div;
};

legend.addTo(map);

document.getElementById('loading-spinner').style.display = 'none'; // Hide spinner after markers are loaded

// Toggle the visibility of the dropdown menu when the hamburger icon is clicked
// document.getElementById('hamburger-toggle').addEventListener('click', function () {
//     const dropdownMenu = document.getElementById('dropdown-menu');
//     dropdownMenu.classList.toggle('show'); // Toggle the "show" class to display/hide the menu
// });

// Select both the hamburger icon, menu label, and the dropdown menu
const hamburgerToggle = document.getElementById('hamburger-toggle');
const menuLabel = document.querySelector('.menu-label');
const dropdownMenu = document.getElementById('dropdown-menu');

// Function to toggle the visibility of the dropdown menu
function toggleDropdown() {
    dropdownMenu.classList.toggle('show'); // Toggle the "show" class to display/hide the menu
}

// Function to close the dropdown if clicked outside
function closeDropdown(event) {
    if (!dropdownMenu.contains(event.target) && !hamburgerToggle.contains(event.target) && !menuLabel.contains(event.target)) {
        dropdownMenu.classList.remove('show'); // Hide the menu
    }
}

// Add event listeners for both the hamburger icon and the menu label
hamburgerToggle.addEventListener('click', toggleDropdown);
menuLabel.addEventListener('click', toggleDropdown);

// Close dropdown if click is outside of the dropdown, hamburger icon, or menu label
document.addEventListener('click', closeDropdown);

// Close the dropdown when a link inside the menu is clicked
const menuLinks = document.querySelectorAll('.dropdown-content a');
menuLinks.forEach(link => {
    link.addEventListener('click', function () {
        const dropdownMenu = document.getElementById('dropdown-menu');
        dropdownMenu.classList.remove('show'); // Hide the dropdown when any link is clicked
    });
});
