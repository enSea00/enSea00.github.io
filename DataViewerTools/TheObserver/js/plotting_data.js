// Activate loading spinner
// document.getElementById('loading-spinner').style.display = 'block';

// DATA PREPARATION ////////////////////////////////////////////////////////////////////////////////////////

// This code manually defines available data types and assigns color to their markers
const name_color = [
    ['Weather Station', '#a6cee3'],
    ['River Gauge', '#1f78b4'],
    ['Rain Radar', '#ff7f00'],
    ['Rain Gauge', '#ffb061'],
    ['Tide Gauge', '#b2df8a'],
    ['Tide Prediction', '#33a02c'],
    ['Wave Buoy', '#e31a1c'],
    ['Swellnet (Cam)', '#fdbf6f'],
    ['Surfline (Cam)', '#6a3d9a'],
    ['Surfline (No Cam)', '#cab2d6'],
    ['Willy Weather', '#fb9a99'],
    ['Web Camera', '#ffff99'],
    ['Ocean Buoy (Active)', '#b15928'],
    ['Ocean Buoy (Historical)', '#ab8671']
]

const uniqueDataTypes = name_color.map(item => item[0]);
const predefinedColors = name_color.map(item => item[1]);

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
    maxBounds: [
        [-90, -15], // Southwest corner (latitude, longitude)
        [90, 370]   // Northeast corner (latitude, longitude)
    ],
    maxBoundsViscosity: 1.0, // Makes panning feel "sticky" at the edges
    
}).setView(Australia_Coordinates, 3); // Set initial map view (latitude, longitude, zoom level)

// Ensure the map is already initialized as 'map'

// Try to get user's location
if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
        function (position) {
            const userLat = position.coords.latitude;
            const userLng = position.coords.longitude;

            const userIcon = L.icon({
            // className: 'material-icons',
            // html: '<i class="material-icons">person_pin_circle</i>',
            iconUrl: 'images/location_pin.png',
            iconSize: [80, 80],
            iconAnchor: [40, 80],
            });
                                        
                          
            // Add a marker at the user's location
            L.marker([userLat, userLng], { icon: userIcon })
            .addTo(map)
            // .bindPopup("📍 You are here!")
            .openPopup();
          
            // Optional: center the map on the user's location
            map.setView([userLat, userLng], 9, { animate: true });
        },
        function (error) {
            console.error("Geolocation error:", error.message);
        }
    );
} else {
    console.warn("Geolocation is not supported by this browser.");
}

// BASE LAYERS //////////////////////////////////////////////////////////////////////////////////////////////////////////

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

// CATCHMENT LAYER OVERLAY (Australia only) ///////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

catchmentLayer.on("load", function () {
    catchmentLabels.clearLayers(); // Clear existing labels before reloading

    catchmentLayer.eachFeature(function (layer) {
        var props = layer.feature.properties;
        if (props && props.level2name) {
            // Round albersarea to 2 decimal places, convert to km², and add thousands separator
            var albersArea = (props.albersarea / 1000000).toFixed(2); // Convert to km² and round to 2 decimal places
            var albersAreaFormatted = Number(albersArea).toLocaleString(); // Add comma separator
            
            var albersAreaHtml = `${albersAreaFormatted} km<sup>²</sup>`; // Format km² with superscript

            // Create the HTML content for the popup
            var popupHTML = `
                <div class="catchment-popup-content">
                    <strong>${props.level2name}</strong><br>
                    Area: ${albersAreaHtml}
                </div>
            `;

            // Create a temporary element to get the computed font size from CSS
            var tempElement = document.createElement("div");
            tempElement.classList.add("catchment-label"); // Add the same class as the label to get the correct styles
            document.body.appendChild(tempElement); // Append to the body to get the style
            var fontSize = window.getComputedStyle(tempElement).fontSize; // Get the computed font size
            document.body.removeChild(tempElement); // Remove the temporary element

            // Convert the font size from 'px' string to a number
            var fontSizeNumber = parseFloat(fontSize);

            // Calculate label height as 1.1 times the font size
            var labelHeight = fontSizeNumber * 1.5; // 1.1 times the font size for height

            // Estimate the width of the label based on the number of characters in the name
            var nameLength = props.level2name.length;
            var labelWidth = 10 * nameLength; // Approximate width based on character count (10px per character)

            // Ensure the label width is at least 100px wide (fallback for short names)
            labelWidth = Math.max(labelWidth, 100);

            // Create the label marker (only for the position of the label)
            var label = L.marker(layer.getBounds().getCenter(), {
                icon: L.divIcon({
                    className: "catchment-label",  // Refer to CSS class for styling
                    html: props.level2name,  // Display only the Level 2 Name in the label
                    iconSize: [labelWidth, labelHeight], // Set the width dynamically, height is calculated based on font size
                    iconAnchor: [labelWidth / 2, labelHeight]  // Position the label at its center
                })
            });

            // Bind a tooltip to show on hover
            label.bindTooltip(popupHTML, {
                permanent: false,  // Tooltip is not permanent
                direction: 'top',  // Show tooltip above the marker
                offset: L.point(0, -1.5*12)  // Adjust the tooltip position
            });
            
            catchmentLabels.addLayer(label);
        }
    });

    updateLabelsVisibility(); // Ensure correct label visibility on initial load
});

// Ensure labels update when zooming
map.on("zoomend", updateLabelsVisibility);

// CREATE MAP LAYER OVERLAY CONTROL ////////////////////////////////////////////////////////////////////////////////

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

// DISPLAY LAT LON of mouse cursor location - PC ONLY ////////////////////////////////////////////////////////////////////////////////
map.on('mousemove', function(e) {
    const lat = e.latlng.lat.toFixed(5);
    let lon = e.latlng.lng.toFixed(5); // Use 'let' instead of 'const'
    
    if (lon > 180) {
        lon = (lon - 360).toFixed(5); // Convert to correct west longitude
        document.getElementById('latlon-display').innerHTML = `${Math.abs(lon)}°W, ${lat}°N`;
    } else {
        document.getElementById('latlon-display').innerHTML = `${lon}°E, ${lat}°N`;
    }
});

// DISPLAY LAT LON POPUP OF CLICKED LOCATION ///////////////////////////////////////////////////////////////////////////////////// 
function hideCustomAlert() {
    var alertElement = document.getElementById('custom-alert');
    alertElement.style.display = 'none';
    alertElement.classList.remove('show');
}

map.on('contextmenu', function(e) { // use 'contextmenu' for right click
// map.on('click', function(e) {   // use 'click' for left click
        // Hide any existing alert before showing a new one
    hideCustomAlert(); 

    const lat = e.latlng.lat.toFixed(5);
    let lon = e.latlng.lng.toFixed(5); 
    let div_html;
    if (lon > 180) {
        lon = (lon - 360).toFixed(5); 
        div_html = `${Math.abs(lon)}°W, ${lat}°N`;
    } else {
        div_html = `${lon}°E, ${lat}°N`;
    }

    map.closePopup();

    let popupContent = `
    <div style="text-align: center; font-size:14px; display: flex; align-items: center; justify-content: center; padding: 2px;">
        <p style="margin: 0 10px 0 0; white-space: nowrap; line-height: 1.2;">${div_html}</p>
        <i class="far fa-copy" style="font-size: 16px; cursor: pointer; padding: 0;"></i> <!-- Copy icon -->
    </div>
    `;

    let popup = L.popup()
        .setLatLng(e.latlng)
        .setContent(popupContent)
        .openOn(map);

    popup.getElement().addEventListener('click', function(event) {
        if (event.target && event.target.classList.contains('fa-copy')) {
            // Copy the coordinates to clipboard
            navigator.clipboard.writeText(div_html).then(function() {
                // Show custom alert
                var alertElement = document.getElementById('custom-alert');
                alertElement.style.display = 'block';
                alertElement.classList.add('show');
                setTimeout(function() {
                    hideCustomAlert(); // Hide alert after 3 seconds
                }, 3000); // Hide the alert after 3 seconds
            }).catch(function(error) {
                console.error('Failed to copy coordinates:', error);
            });
        }
    });
});

map.on('click', function() {
    hideCustomAlert();  // Hide the custom alert when a left-click occurs
});

// ADD LOCATION MARKERS TO MAP ////////////////////////////////////////////////////////////////////////////////

// loading spinner helper functions
let loadingTimeout;

function showLoadingSpinnerDelayed(delay = 500) {
    loadingTimeout = setTimeout(() => {
        const loader = document.getElementById("loading-spinner");
        if (loader) loader.style.display = "block";
    }, delay);
}

function hideLoadingSpinner() {
    clearTimeout(loadingTimeout);
    const loader = document.getElementById("loading-spinner");
    if (loader) loader.style.display = "none";
}

// Function to dynamically load a script
function loadScript(src, callback) {
    let script = document.createElement('script');
    script.src = src;
    script.onload = function() {
        callback();
    };
    script.onerror = function() {
        console.error('Failed to load script:', src); // Debug: Handle errors in script loading
    };
    document.head.appendChild(script);
}

// Create a separate MarkerCluster group for each DataType
const dataTypeGroups = {};  
Object.keys(groupedLocations).forEach((dataType) => {
    const color = colorScheme[dataType];  

    // Create a MarkerCluster group for the current DataType
    const markers = L.markerClusterGroup({
        iconCreateFunction: function(cluster) {
            const childCount = cluster.getChildCount();
            const minClusterSize = 16;
            let clusterSize = 1.3 * minClusterSize + childCount * 0.75; 
            clusterSize = Math.max(clusterSize, minClusterSize);
            clusterSize = Math.min(clusterSize, 42);

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
                html: `<div class="marker-icon" style="background-color:${color};"></div>`,
            }),
            owner: loc.Owner,
            dataType: loc.DataType,
            name: loc.Name,
        });

        // Format lat, lon to 5 decimal places
        var lon = parseFloat(loc.Longitude);
        var lon_label = '°E';
        if (lon > 180) {
            lon = (360 - lon).toFixed(5);
            lon_label = '°W';
        } else {
            lon = lon.toFixed(5);
        }
        var lat = parseFloat(loc.Latitude).toFixed(5);

        // Bind a tooltip to show on hover
        marker.bindTooltip(`
            <i>${loc.DataType}</i><br>
            <b>Location: </b>${loc.Name}<br>
            (${lon}${lon_label}, ${lat}°N)
        `, {
            permanent: false,  
            direction: 'top',  
            offset: L.point(0, -10)  
        });

        // popup plotting /////////////////////////////////////////////////////////////////////

        marker.on('click', async function () {

            showLoadingSpinnerDelayed(100); // show only after N ms if still loading
        
            const dataType = marker.options.dataType;
            const owner = marker.options.owner;
        
            try {
                
                // Wave Data
                if (dataType === 'Wave Buoy' && owner === 'Qld Gov') {
                    await loadScriptAsync('js/getData_Waves_Qld.js');
                    await getData_Waves_Qld(loc);
                } else if (dataType === 'Wave Buoy' && owner === 'MHL') {
                    await loadScriptAsync('js/getData_Waves_NSW.js');
                    await getData_Waves_NSW(loc);
                } else if (dataType === 'Wave Buoy' && owner === 'Vic Gov') {
                    await loadScriptAsync('js/getData_Waves_Vic.js');
                    await getData_Waves_Vic(loc);
                } else if (dataType === 'Wave Buoy' && owner === 'UWA') {
                    await loadScriptAsync('js/getData_Waves_WA_UWA.js');
                    await getData_Waves_WA_UWA(loc);
                
                // Tide Data
                } else if (dataType === 'Tide Gauge' && owner === 'Qld Gov') {
                    await loadScriptAsync('js/getData_Tides_Qld.js');
                    await getData_Tides_Qld(loc);
                } else if (dataType === 'Tide Gauge' && owner === 'MHL') {
                    await loadScriptAsync('js/getData_Tides_NSW_MHL.js');
                    await getData_Tides_NSW_MHL(loc);
                
                // River Data 
                } else if (dataType === 'River Gauge' && owner === 'MHL') {
                    await loadScriptAsync('js/getData_Rivers_NSW_MHL.js');
                    await getData_Rivers_NSW_MHL(loc);

                // Rain Data
                } else if (dataType === 'Rain Gauge' && owner === 'MHL') {
                    await loadScriptAsync('js/getData_Rain_NSW_MHL.js');
                    await getData_Rain_NSW_MHL(loc);

                // Ocean Buoy Data
                } else if (dataType === 'Ocean Buoy (Active)' && owner === 'NDBC') {
                    await loadScriptAsync('js/getData_OceanBuoys_NDBC.js');
                    await getData_OceanBuoys_NDBC(loc);

                // AWS Data- not working due to CORS blocking
                // } else if (dataType === 'Weather Station' && owner === 'BoM') {
                //     await loadScriptAsync('js/getData_Weather_BoM.js');
                //     await getData_Weather_BoM(loc);
                
                // Open External Bookmarked page
                } else if (loc.URL) { // no data available so open bookmark url instead
                    let lastClick = 0;
                    marker.on('click', function () {
                        const now = Date.now();
                        if (now - lastClick < 1000) return; // Ignore double clicks within 1 second - for ipad duplicate opening issue
                        lastClick = now;
                        if (loc.URL) {
                            window.open(loc.URL, '_blank');
                        }
                    });
                }
            } catch (err) {
                console.error('Error handling marker click:', err);
            }
        
            // if (loader) loader.style.display = "none";
            hideLoadingSpinner();

        });

        function loadScriptAsync(src) {
            return new Promise((resolve, reject) => {
              loadScript(src, () => resolve(), reject);
            });
          }
          
        // Add marker to the marker cluster for this DataType
        markers.addLayer(marker);
    });

    // Store the MarkerCluster group for this DataType
    dataTypeGroups[dataType] = markers;
    map.addLayer(markers);
});

// SCALE BAR ////////////////////////////////////////////////////////////////////////////////////////
L.control.scale().addTo(map);

// LOCATION SEARCH ////////////////////////////////////////////////////////////////////////////////////////

// Add geocoder search control
var geocoder = L.Control.geocoder({
    defaultMarkGeocode: false,
    geocoder: L.Control.Geocoder.nominatim()  // Use Nominatim (OSM) for location search
})
.on('markgeocode', function(e) {
    var latlng = e.geocode.center;
    
    // Adjust longitude if negative
    if (latlng.lng < 0) {
        latlng.lng += 360;
    }
    
    // Smoothly fly to the searched location
    map.flyTo(latlng, 12, { duration: 1.5 });

    let shortName = e.geocode.name.split(',')[0].trim();

    // Styled popup content
    const popupContent = `
    <div style="text-align: center; font-size:14px;">
        <b>${shortName}</b><br>
        (${latlng.lng.toFixed(5)}°E, ${latlng.lat.toFixed(5)}°N)
    </div>
    `;

})
.addTo(map);

// DISTANCE MEASUREMENT TOOL ///////////////////////////////////////////////////////////////////////////////

// Feature group to store drawn layers
const drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Initialize Leaflet Draw Control for drawing shapes and measuring
const drawControl = new L.Control.Draw({
    position: 'bottomright',
    draw: {
        polygon: true,     // Allow polygon drawing (useful for measuring areas)
        polyline: true,    // Allow polyline drawing (useful for measuring distance)
        rectangle: true,  // Disable rectangle
        circlemarker: false,     // Disable circle
        circle: false,
        marker: false,     // Disable marker
        layers: false,
    },
    edit: {
        featureGroup: drawnItems // Where drawn shapes will be stored
    }
});
map.addControl(drawControl);

// Function to calculate polyline distance
function calculateDistance(latlngs) {
    let totalDistance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
        totalDistance += map.distance(latlngs[i], latlngs[i + 1]); // Distance in meters
    }
    return totalDistance;
}

// Function to calculate polygon area
function calculateArea(latlngs) {
    return L.GeometryUtil.geodesicArea(latlngs[0]); // Area in square meters
}

// Listen for drawing events to measure distance/area
map.on('draw:created', function (e) {
    const layer = e.layer;
    drawnItems.addLayer(layer); // Add drawn layer to the map

    if (e.layerType === 'polyline') {
        const distance = calculateDistance(layer.getLatLngs());
        alert(`Distance: ${(distance / 1000).toFixed(2)} km`); // Convert to km
    } else if (e.layerType === 'polygon') {
        const area = calculateArea(layer.getLatLngs());
        alert(`Area: ${(area / 1000000).toFixed(2)} km²`); // Convert to km²
    }

    else if (e.layerType === 'rectangle') {
        const area = calculateArea(layer.getLatLngs());
        alert(`Area: ${(area / 1000000).toFixed(2)} km²`); // Convert to km²
    }
});

// LEGEND ////////////////////////////////////////////////////////////////////////////////////////

// Add an interactive legend to the map
const legend = L.control({ position: 'topright' });

legend.onAdd = function () {
    const div = L.DomUtil.create('div', 'info legend');
    div.innerHTML = '<div class="legend-title">Double click to isolate data type.<br>Single click to hide/show data type.</div>';

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

// Prevent map click event when interacting with the legend & close popups
document.getElementById('legend-container').addEventListener('click', function(event) {
    event.stopPropagation(); // Prevents click from reaching the map
    map.closePopup(); // Closes any open lat/lon popup

    const item = event.target.closest('.legend-item');
    if (!item) return;

    const selectedType = item.dataset.type;
    if (!selectedType) return;

    const layerGroup = dataTypeGroups[selectedType];
    if (!layerGroup) return;

    if (map.hasLayer(layerGroup)) {
        map.removeLayer(layerGroup);
        item.classList.add('disabled');
    } else {
        map.addLayer(layerGroup);
        item.classList.remove('disabled');
    }

    // Exit isolation mode if more than one group is visible
    const visibleCount = Object.keys(dataTypeGroups).filter((type) =>
        map.hasLayer(dataTypeGroups[type])
    ).length;

    isolatedType = visibleCount === 1 ? selectedType : null;
});


// Prevent lat/lon popup when double-clicking the legend
document.getElementById('legend-container').addEventListener('dblclick', function(event) {
    event.stopPropagation(); // Stops double click from triggering the map's click event
    map.closePopup(); // Closes any open lat/lon popup

    const item = event.target.closest('.legend-item');
    if (!item) return;

    const selectedType = item.dataset.type;
    if (!selectedType) return;

    if (isolatedType === selectedType) {
        // Restore all markers
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
hamburgerToggle.addEventListener('click', function(event) {
    // Toggle the hamburger dropdown
    toggleDropdown(event, 'hamburger');
    map.closePopup(); // Closes any open lat/lon popup
    // Close the plot overlay if it's open
    const overlayDiv = document.getElementById('plotOverlay');
    if (overlayDiv.style.display !== 'none') {
        overlayDiv.style.display = 'none';
        document.getElementById('infoBox').style.display = 'none';
    }
});

// INFO DROPDOWN ///////////////////////////////////////////////////////////////////////////////////////////////////////

document.getElementById('info-toggle').addEventListener('click', function(event) {
    // Toggle the info dropdown
    toggleDropdown(event, 'info');
    map.closePopup(); // Closes any open lat/lon popup
    // Close the plot overlay if it's open
    const overlayDiv = document.getElementById('plotOverlay');
    if (overlayDiv.style.display !== 'none') {
        overlayDiv.style.display = 'none';
        document.getElementById('infoBox').style.display = 'none';
    }
});

// Function to toggle dropdown visibility
function toggleDropdown(event, type) {
    const hamburgerDropdown = document.getElementById('dropdown-menu');
    const infoDropdown = document.getElementById('info-dropdown');

    if (type === 'hamburger') {
        // Close the info dropdown if it's open
        if (infoDropdown.classList.contains('active')) {
            infoDropdown.classList.remove('active');
        }
        // Toggle the hamburger dropdown
        hamburgerDropdown.classList.toggle('show');
    } else if (type === 'info') {
        // Close the hamburger dropdown if it's open
        if (hamburgerDropdown.classList.contains('show')) {
            hamburgerDropdown.classList.remove('show');
        }
        // Toggle the info dropdown
        infoDropdown.classList.toggle('active');
    }

    // Prevent event bubbling
    event.stopPropagation();
}

// Close dropdown if clicked outside
document.addEventListener('click', function(event) {
    const hamburgerDropdown = document.getElementById('dropdown-menu');
    const infoDropdown = document.getElementById('info-dropdown');
    
    // Close both dropdowns if the click is outside of both
    if (!event.target.closest('#hamburger-toggle') && !event.target.closest('#info-toggle')) {
        if (hamburgerDropdown.classList.contains('show')) {
            hamburgerDropdown.classList.remove('show');
        }
        if (infoDropdown.classList.contains('active')) {
            infoDropdown.classList.remove('active');
        }
    }
});

// Close the dropdown when a link inside the menu is clicked
const menuLinks = document.querySelectorAll('.dropdown-content a');
menuLinks.forEach(link => {
    link.addEventListener('click', function () {
        const dropdownMenu = document.getElementById('dropdown-menu');
        dropdownMenu.classList.remove('show'); // Hide the dropdown when any link is clicked
    });
});

// HIDE LOADING SPINNER (when everything is loaded) /////////////////////////////////////////////////////////////////////

// Create an array to track loading promises
const loadingPromises = [];

// Show spinner when zooming starts
map.on("zoomstart", () => {
    loader.style.display = "block";
});

// Hide spinner when zooming stops
map.on("zoomend", () => {
    loader.style.display = "none";
});

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

// PLOTTING OVERLAY ////////////////////////////////////////////////////////////////////////////////////////
// function configureAxis(axis) {
//         return {
//             title: {text: axis.title},   // Axis title
//             // domain: axis.domain,         // Axis domain (position)
//             zeroline: axis.zeroline || false,     // Show zero line
//             showgrid: true,              // Show grid lines
//             gridcolor: 'rgba(240, 240, 240, 0.2)', // Grid color: off-white, partially transparent
//             gridwidth: 1,                // Grid line width
//             linecolor: 'rgba(240, 240, 240, 0.4)', // Axis line color
//             linewidth: 2,                // Axis line width
//             tickcolor: 'rgba(240, 240, 240, 0.4)', // Tick color
//             ticks: 'outside',            // Tick marks outside the axis
//             tickfont: { color: '#f0f0f0' }, // Tick label font color
//             tickformat: axis.tickformat || '',  // Optional tick format
//             showticklabels: axis.showticklabels || true,
//             dash: 'dash',                 // Dotted grid lines
//             showline: true,              // Show axis line
//             mirror: false,                // Mirror axis lines on all sides
//             title_standoff: axis.title_standoff || 25, // Ensure the right axis label has more space from the plot
//         };
//     }
    
// END ////////////////////////////////////////////////////////////////////////////////////////
