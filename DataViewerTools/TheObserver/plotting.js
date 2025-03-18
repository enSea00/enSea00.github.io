// Activate loading spinner
document.getElementById('loading-spinner').style.display = 'block';

// DATA PREPARATION ////////////////////////////////////////////////////////////////////////////////////////

// This code manually defines available data types and assigns color to their markers
const uniqueDataTypes = ['Weather Station', 'River Gauge', 'Rain Radar', 'Tide Gauge', 'Tide Prediction',  'Wave Buoy', 'Swellnet (Cam)',  'Surfline (No Cam)', 'Surfline (Cam)', 'Willy Weather', 'Web Camera', 'Ocean Buoy (NDBC)']
const predefinedColors = ["#a6cee3", "#1f78b4", "#ff7f00", "#b2df8a", "#33a02c", "#e31a1c", "#fdbf6f", "#cab2d6", "#6a3d9a", "#fb9a99", "#ffff99", "#b15928"]

// Map each DataType to a corresponding color from the predefined list
const colorScheme = uniqueDataTypes.reduce((acc, dataType, index) => {
    acc[dataType] = predefinedColors[index];  // Assign the corresponding color from the predefined list
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

// INITIALISE MAP AND INTERACTIVITY ////////////////////////////////////////////////////////////////////////////////
const Australia_Coordinates = [-25.2744, 133.7751]; // Initial map center
const map = L.map('map', {
    zoomControl: false, // This disables the default +/- zoom controls in the top left
    minZoom: 2,
}).setView(Australia_Coordinates, 3); // Set initial map view (latitude, longitude, zoom level)

// Available arcgis rest services
// https://server.arcgisonline.com/ArcGIS/rest/services

// BASE LAYER - Satellite layer (No Labels)
var satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a>',
    opacity: 1,
}).addTo(map);

// add locations to satellite image
var locationLabels = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
    attribution: '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a>',
    opacity: 1
}).addTo(map);

// BASE LAYER - Topographic
var topo = L.tileLayer('https://server.arcgisonline.com/arcgis/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; <a href="https://www.esri.com/" target="_blank">Esri</a>',
      });

// OVERLAY - Catchment Boundaries Layer (Australian)
var catchmentLayer = L.esri.featureLayer({
    url: "https://services.ga.gov.au/gis/rest/services/Surface_Hydrology/MapServer/6",
    attribution: '&copy; <a href="https://ecat.ga.gov.au/geonetwork/srv/eng/catalog.search#/metadata/73078" target="_blank">Geoscience Australia</a>',
    style: function () {
        return { color: 'rgba(255,215,0,0.8)', weight: 2, opacity: 0.7, fillOpacity: 0.0 };
    }
});

// Create a layer for static labels
var catchmentLabels = L.layerGroup();
var minZoomToShowLabels = 7; // Labels only appear at zoom level 7 or higher

// Function to update label visibility based on zoom and layer presence
function updateLabelsVisibility() {
    var zoom = map.getZoom();
    if (map.hasLayer(catchmentLayer) && zoom >= minZoomToShowLabels) {
        map.addLayer(catchmentLabels);
    } else {
        map.removeLayer(catchmentLabels);
    }
}

// Hide labels when catchmentLayer is removed
map.on("overlayremove", function (event) {
    if (event.layer === catchmentLayer) {
        map.removeLayer(catchmentLabels); // Remove labels when catchmentLayer is removed
    }
});

// Load labels only once when the catchment layer loads
catchmentLayer.on("load", function () {
    catchmentLabels.clearLayers(); // Clear existing labels before reloading

    catchmentLayer.eachFeature(function (layer) {
        var props = layer.feature.properties;
        if (props && props.level2name) {
            var label = L.marker(layer.getBounds().getCenter(), {
                icon: L.divIcon({
                    className: "catchment-label",
                    html: props.level2name,
                    iconSize: null // Ensures default size
                })
            });
            catchmentLabels.addLayer(label);
        }
    });

    updateLabelsVisibility(); // Ensure correct label visibility on initial load
});

// Ensure labels update when zooming
map.on("zoomend", updateLabelsVisibility);

// Create map layer control ////////////////////////////////////////////////////////////////////////////////

// Get the loader element
var loader = document.getElementById("loading-spinner");

// Show loader when an overlay is added
map.on("overlayadd", function (event) {
    loader.style.display = "block"; // Show the spinner

    if (event.layer === catchmentLayer) {
        event.layer.once("load", function () {
            loader.style.display = "none"; // Hide when loading is complete
        });
    }
});

// Hide loader if the overlay is removed
map.on("overlayremove", function () {
    loader.style.display = "none";
});

// Base and overlay layers
var baseLayers = {
    "Satellite": satellite,
    "Topographic": topo,
};

var overlayLayers = {
    "Catchments (Aus)": catchmentLayer,
};

// Add overlay layer control
var layerControl = L.control.layers(baseLayers, overlayLayers).addTo(map);


// Function to toggle label layer visibility
map.on("baselayerchange", function (event) {
    if (event.layer === satellite) {
        map.addLayer(locationLabels); // Show labels when Satellite is selected
    } else {
        map.removeLayer(locationLabels); // Hide labels when switching away
    }
});
// Display lat lon of mouse cursor location - PC ONLY ////////////////////////////////////////////////////////////////////////////////
map.on('mousemove', function(e) {
    const lat = e.latlng.lat.toFixed(5);
    const lon = e.latlng.lng.toFixed(5);
    document.getElementById('latlon-display').innerHTML = `${lon}°E, ${lat}°N`;
});

// Display popup of lat lon of clicked location ///////////////////////////////////////////////////////////////////////////////////// 
map.on('click', function(e) {
    // Get the latitude and longitude from the click event
    const latLon = `${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(5)}`;

    // Close any open popup before opening a new one
    map.closePopup();

    // Create the popup content
    const popupContent = `
        <div style="text-align: center; font-size:14px;">
            <p>${e.latlng.lng.toFixed(5)}°E, ${e.latlng.lat.toFixed(5)}°N</p>
        </div>
    `;

    // Create and open the new popup at the clicked location
    L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);
});

// ADD LOCATION MARKERS TO MAP ////////////////////////////////////////////////////////////////////////////////

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
            (${loc.Longitude}°E, ${loc.Latitude}°N)
        `);

        // Bind a tooltip to show on hover
        marker.bindTooltip(`
            <i>${loc.DataType}</i><br>
            <b>Location: </b>${loc.Name}<br>
            (${loc.Longitude}°E, ${loc.Latitude}°N)
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

// LEGEND ////////////////////////////////////////////////////////////////////////////////////////

// Add an interactive legend to the map
const legend = L.control({ position: 'topright' });

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '';

    uniqueDataTypes.forEach((dataType) => {
        div.innerHTML += `
            <div class="legend-item" data-type="${dataType}">
                <span class="legend-color" style="background-color:${colorScheme[dataType]}"></span>
                <span class="legend-label">${dataType}</span>
            </div>
        `;
    });

    return div;
};

// Add legend to the map
legend.addTo(map);

// Move the legend under the hamburger menu
setTimeout(() => {
    const legendContainer = legend.getContainer();
    if (legendContainer) {
        document.getElementById('legend-container').appendChild(legendContainer);
    } else {
        console.error("Legend container not found");
    }
}, 100);

// Track if the map is in "isolated mode" (only one group shown)
let isolatedType = null;

// Handle single-click to toggle visibility
document.getElementById('legend-container').addEventListener('click', (event) => {
    const item = event.target.closest('.legend-item');
    if (!item) return;

    const dataType = item.dataset.type;
    if (!dataType) return;

    if (map.hasLayer(dataTypeGroups[dataType])) {
        map.removeLayer(dataTypeGroups[dataType]);
        item.classList.add('disabled'); // Visually indicate hidden
    } else {
        map.addLayer(dataTypeGroups[dataType]);
        item.classList.remove('disabled');
    }
});

// Handle double-click to isolate or restore all groups
document.getElementById('legend-container').addEventListener('dblclick', (event) => {
    const item = event.target.closest('.legend-item');
    if (!item) return;

    const selectedType = item.dataset.type;
    if (!selectedType) return;

    if (isolatedType === selectedType) {
        // If double-clicking the already isolated type → Restore all groups
        Object.keys(dataTypeGroups).forEach((dataType) => {
            map.addLayer(dataTypeGroups[dataType]);
            document.querySelector(`[data-type="${dataType}"]`).classList.remove('disabled');
        });
        isolatedType = null; // Reset isolation mode
    } else {
        // Hide all groups except the selected one
        Object.keys(dataTypeGroups).forEach((dataType) => {
            map.removeLayer(dataTypeGroups[dataType]);
            document.querySelector(`[data-type="${dataType}"]`).classList.add('disabled');
        });

        // Show only the selected group
        map.addLayer(dataTypeGroups[selectedType]);
        item.classList.remove('disabled');
        isolatedType = selectedType; // Set isolated mode
    }
});

// DROPDOWN HAMBURGER MENU ////////////////////////////////////////////////////////////////////////////////////////

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
    if (!dropdownMenu.contains(event.target) && !hamburgerToggle.contains(event.target)) {
        dropdownMenu.classList.remove('show'); // Hide the menu
    }
}

// Add event listeners for both the hamburger icon and the menu label
hamburgerToggle.addEventListener('click', toggleDropdown);
// menuLabel.addEventListener('click', toggleDropdown);

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

// Hide loading spinner (when everything is loaded) /////////////////////////////////////////////////

// Create an array to track loading promises
const loadingPromises = [];

// Wait for catchment layer to load
// const catchmentLayerLoaded = new Promise((resolve) => {
//     catchmentLayer.on("load", () => {
//         // console.log("Catchment layer fully loaded");
//         resolve();
//     });
// });
// loadingPromises.push(catchmentLayerLoaded);

// Wait for base map (OSM) to load
const satelliteLoaded = new Promise((resolve) => {
    satellite.on("load", () => {
        // console.log("Satellite base map fully loaded");
        resolve();
    });
});
loadingPromises.push(satelliteLoaded);

// Wait for all markers to load
const markersLoaded = new Promise((resolve) => {
    setTimeout(() => {
        // console.log("Markers loaded");
        resolve();
    }, 2000); // Adjust timing if necessary
});
loadingPromises.push(markersLoaded);

// Wait for everything to load, then hide the spinner
Promise.all(loadingPromises).then(() => {
    document.getElementById('loading-spinner').style.display = 'none';
    // console.log("All map elements are fully loaded.");
});

// END OF SCRIPT ////////////////////////////////////////////////////////////////////////////////////////