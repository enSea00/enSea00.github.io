let buoyData = []; // Store buoy data globally

async function downloadData() {
    const url = 'https://apps.des.qld.gov.au/data-sets/waves/wave-7dayopdata.csv';
    const response = await fetch(url);
    const data = await response.text();
    return data;
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[1].split(',').map(header => header.trim());

    const rows = lines.slice(2).map(line => {
        const values = line.split(',');
        return headers.reduce((obj, header, i) => {
            obj[header] = values[i];
            return obj;
        }, {});
    });

    return rows;
}

// Function to trigger CSV download
function downloadCSV() {
    const csvHeaders = ['Site', 'Latitude', 'Longitude', 'DateTime', 'Hsig', 'Hmax', 'Tp', 'Tz', 'Direction'];
    const csvRows = buoyData.map(siteData => {
        const { site, Latitude, Longitude, DateTime, Hsig, Hmax, Tp, Tz, Direction } = siteData;
        return DateTime.map((dt, idx) => [
            site, Latitude, Longitude, dt, Hsig[idx], Hmax[idx], Tp[idx], Tz[idx], Direction[idx]
        ].join(','));
    }).flat(); // Flatten the array of arrays

    // const csvContent = [csvHeaders.join(','), ...csvRows].join('\n');
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    // Get the current date and time
    const now = new Date();
    const formattedDate = now.getFullYear().toString() +
                          (now.getMonth() + 1).toString().padStart(2, '0') + 
                          now.getDate().toString().padStart(2, '0'); // YYYYMMDD format
    const formattedTime = now.getHours().toString().padStart(2, '0') + 
                          now.getMinutes().toString().padStart(2, '0'); // HHMM format

    // Create the filename with site, date, and time
    const fileName = `WaveBuoyData-Qld-${formattedDate}_${formattedTime}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
}

// Event listener for the download button
document.getElementById('download-csv').addEventListener('click', downloadCSV);

function groupBySite(data) {
    const groupedData = {};
    data.forEach(row => {
        const site = row['Site'];
        const latitude = parseFloat(row['Latitude']);
        const longitude = parseFloat(row['Longitude']);
        
        if (!groupedData[site]) {
            groupedData[site] = { DateTime: [], Hsig: [], Hmax: [], Tp: [], Tz: [], Direction: [], SST: [], CurrentDirection: [], CurrentSpeed: [], Latitude: latitude, Longitude: longitude };
        }

        const hsig = parseFloat(row['Hsig']);
        const hmax = parseFloat(row['Hmax']);
        const tp = parseFloat(row['Tp']);
        const tz = parseFloat(row['Tz']);
        const direction = parseFloat(row['Direction']);
        const sst = parseFloat(row['SST']);
        const current_direction = parseFloat(row['Current Direction']);
        const current_speed = parseFloat(row['Current Speed']);
        // console.log(current_speed)

        if (!isNaN(hsig) && !isNaN(tp) && !isNaN(direction)) {
            groupedData[site].DateTime.push(row['DateTime']);
            groupedData[site].Hsig.push(hsig);
            groupedData[site].Hmax.push(hmax);
            groupedData[site].Tp.push(tp);
            groupedData[site].Tz.push(tz);
            groupedData[site].Direction.push(direction);
            groupedData[site].SST.push(sst);
            groupedData[site].CurrentDirection.push(current_direction);
            groupedData[site].CurrentSpeed.push(current_speed);

        }
    });

    buoyData = Object.entries(groupedData).map(([site, data]) => ({
        site,
        ...data
    }));
    
    return groupedData;
}

let selectedSite = null; // Store the currently selected site

function downloadSelectedSiteData() {
    if (!selectedSite) return; // No site selected

    const siteData = buoyData.find(site => site.site === selectedSite);
    if (!siteData) return;

    const headers = ['DateTime', 'Hsig (m)', 'Hmax (m)', 'Tp (s)', 'Tz (s)', 'Direction (degN)','SST (degC)','Current Speed (kts)','Current Direction (degN)'];
    const csvRows = [
        headers.join(','), // Add headers to CSV
        ...siteData.DateTime.map((_, i) => [
            siteData.DateTime[i],
            siteData.Hsig[i],
            siteData.Hmax[i],
            siteData.Tp[i],
            siteData.Tz[i],
            siteData.Direction[i],
            siteData.SST[i],
            siteData.CurrentSpeed[i],
            siteData.CurrentDirection[i]
        ].join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);

    // Get the current date and time
    const now = new Date();
    const formattedDate = now.getFullYear().toString() +
                          (now.getMonth() + 1).toString().padStart(2, '0') + 
                          now.getDate().toString().padStart(2, '0'); // YYYYMMDD format
    const formattedTime = now.getHours().toString().padStart(2, '0') + 
                          now.getMinutes().toString().padStart(2, '0'); // HHMM format

    // Create the filename with site, date, and time
    const fileName = `WaveBuoyData-${selectedSite}-${formattedDate}_${formattedTime}.csv`;

    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    window.URL.revokeObjectURL(url);
}



// Add event listener to the download selected site data button
document.getElementById('download-selected-csv').addEventListener('click', downloadSelectedSiteData);


// PLOT DATA /////////////////////////////////////////////////

// Helper function to filter out -99.9 values before plotting
function filterData(data) {
    return data.map(value => (value === -99.9 ? null : value));
}

// Helper function to check if all values in the 'y' array are null
function allValuesNull(yValues) {
    return yValues.every(value => value === null);
}

function updateLayoutForUnavailableData(layout, yaxis) {
    layout[yaxis] = {
        ...layout[yaxis],
        showticklabels: false, // Hide tick labels
        ticks: '',            // Hide tick marks
    };
}

// Helper function to configure axis settings
function configureAxis(axis) {
    return {
        title: axis.title,           // Axis title
        domain: axis.domain,         // Axis domain (position)
        zeroline: axis.zeroline,     // Show zero line
        showgrid: true,              // Show grid lines
        gridcolor: 'rgba(240, 240, 240, 0.2)', // Grid color: off-white, partially transparent
        gridwidth: 1,                // Grid line width
        linecolor: 'rgba(240, 240, 240, 0.2)',        // Axis line color
        linewidth: 1,                // Axis line width
        tickcolor: 'rgba(240, 240, 240, 0.2)', // Tick color
        ticks: 'outside',            // Tick marks outside the axis
        tickfont: { color: '#f0f0f0' }, // Tick label font color
        tickformat: axis.tickformat || '',  // Optional tick format
        dash: 'dot',                 // Dotted grid lines
        showline: true,              // Show axis line
        mirror: true,                // Mirror axis lines on all sides
    };
}

// Plot time series for click selected site
function plotData(groupedData, site) {
    
    const tracesHsig = [];
    const tracesHmax = [];
    const tracesTp = [];
    const tracesTz = [];
    const tracesDirection = [];
    const tracesCurrentDirection = [];
    const tracesCurrentSpeed = [];
    const tracesSST = [];

    const siteData = groupedData[site];
    
    selectedSite = site; // Store the selected site
    document.getElementById('download-selected-csv').disabled = false; // Enable the button
    // Dynamically set the site name in the <h2> element
    // document.getElementById('site-title').innerHTML = `Selected Site: ${site}`;

    // wave heights
    tracesHsig.push({
        x: siteData.DateTime,
        y: filterData(siteData.Hsig), // Filter Hsig data
        mode: 'lines',
        name: `H<sub>sig</sub>`,
        yaxis: 'y1',
        line: { color: '#1f77b4' } // Example color for Hsig
    });

    tracesHmax.push({
        x: siteData.DateTime,
        y: filterData(siteData.Hmax), // Filter Hmax data
        mode: 'lines',
        name: `H<sub>max</sub>`,
        yaxis: 'y1',
        line: { color: '#ff7f0e' } // Example color for Hmax
    });

    // wave periods
    tracesTp.push({
        x: siteData.DateTime,
        y: filterData(siteData.Tp), // Filter Tp data
        mode: 'lines',
        name: `T<sub>p</sub>`,
        yaxis: 'y2',
        line: { color: '#9467bd' } // Example color for Tp
    });

    tracesTz.push({
        x: siteData.DateTime,
        y: filterData(siteData.Tz), // Filter Tz data
        mode: 'lines',
        name: `T<sub>z</sub>`,
        yaxis: 'y2',
        line: { color: '#2ca02c' } // Example color for Tz
    });

    // wave direction
    tracesDirection.push({
        x: siteData.DateTime,
        y: filterData(siteData.Direction), // Filter Direction data
        mode: 'lines',
        name: `Direction`,
        yaxis: 'y3',
        line: { color: '#17becf' } // Example color for Direction
    });

    // SST
    tracesSST.push({
        x: siteData.DateTime,
        y: filterData(siteData.SST), // Filter SST data
        mode: 'lines',
        name: `SST`,
        yaxis: 'y4',
        line: { color: 'coral' } // Example color for SST
    });

    // currents
    tracesCurrentSpeed.push({
        x: siteData.DateTime,
        y: filterData(siteData.CurrentSpeed), // Filter Current Speed data
        mode: 'lines',
        name: `Current Speed`,
        yaxis: 'y5',
        line: { color: 'lightgreen' } // Example color for Current Speed
    });

    // figure layout
    const layout = {
        grid: { rows: 5, columns: 1, pattern: 'independent' },
        height: 600,
        width: Math.min(window.innerWidth * 0.9, 1000), // Set width dynamically, limited to screen size
    
        title: `Selected Site: ${site}`,
        plot_bgcolor: '#1e1e1e',
        paper_bgcolor: '#333',
        font: { color: 'white' },
    
        // Apply settings to x-axes
        xaxis: configureAxis({ title: '', zeroline: false}),
        xaxis2: configureAxis({ title: '', zeroline: false}),
        xaxis3: configureAxis({ title: '', zeroline: false}),
        xaxis4: configureAxis({ title: '', zeroline: false}),
        xaxis5: configureAxis({ title: 'Date Time (Local)', zeroline: false}),


        // Apply settings to all y-axes
        yaxis: configureAxis({ title: 'Height (m)', domain: [0.8, .98], zeroline: false }),
        yaxis2: configureAxis({ title: 'Period (sec)', domain: [0.6, 0.78], zeroline: false }),
        yaxis3: configureAxis({ title: 'Dir (&deg;N)', domain: [0.4, 0.58], zeroline: false }),
        yaxis4: configureAxis({ title: 'SST (&deg;C)', domain: [0.2, 0.38], zeroline: false }),
        yaxis5: configureAxis({ title: 'Current (m/s)', domain: [0, 0.18], zeroline: false }),
    
   
        showlegend: true,
        legend: { font: { color: 'white' } },
        margin: { l: 60, r: 20, t: 30, b: 50 },
        hovermode: 'x',
    };
    

    const traces = [
        ...tracesHsig.map(trace => ({ ...trace, xaxis: 'x5', yaxis: 'y1' })),
        ...tracesHmax.map(trace => ({ ...trace, xaxis: 'x5', yaxis: 'y1' })),

        ...tracesTp.map(trace => ({ ...trace, xaxis: 'x5', yaxis: 'y2' })),
        ...tracesTz.map(trace => ({ ...trace, xaxis: 'x5', yaxis: 'y2' })),

        ...tracesDirection.map(trace => ({ ...trace, xaxis: 'x5', yaxis: 'y3' })),

        ...tracesSST.map(trace => ({ ...trace, xaxis: 'x5', yaxis: 'y4' })),

        ...tracesCurrentSpeed.map(trace => ({ ...trace, xaxis: 'x5', yaxis: 'y5' })),
    ];

    Plotly.newPlot('plot', traces, layout);
}


// Function to create the map
function createMap(groupedData) {
    // Calculate the average latitude and longitude of all valid buoys
    let totalLat = 0;
    let totalLon = 0;
    let validSitesCount = 0;
    let southernmostSite = null;
    let southernmostLat = Infinity; // Initialize to a large value for comparison
    const markers = {}; // Store markers by site ID

    Object.keys(groupedData).forEach(site => {
        const { Latitude, Longitude } = groupedData[site];

        if (!Latitude || !Longitude || isNaN(Latitude) || isNaN(Longitude)) {
            console.warn(`Invalid coordinates for site: ${site}`);
            return; // Skip this iteration if coordinates are invalid
        }

        // Sum up latitudes and longitudes for calculating the average
        totalLat += Latitude;
        totalLon += Longitude;
        validSitesCount++;

        // Check if this site is the southernmost (smallest latitude)
        if (Latitude < southernmostLat) {
            southernmostLat = Latitude;
            southernmostSite = site;
        }
    });

    // Calculate the average latitude and longitude
    const avgLat = totalLat / validSitesCount;
    const avgLon = totalLon / validSitesCount;

    // Create the map centered on the average location
    const map = L.map('map').setView([avgLat, avgLon], 4); // Initial zoom level 4

    // OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Define default and selected colors for markers
    const defaultColor = "#3388ff"; // Default blue color
    const selectedColor = "#ff0000"; // Selected red color

    // Add buoy markers to the map
    Object.keys(groupedData).forEach(site => {
        const { Latitude, Longitude, DateTime, Hsig, Hmax, Tp, Tz, Direction } = groupedData[site];

        if (!Latitude || !Longitude || isNaN(Latitude) || isNaN(Longitude)) {
            console.warn(`Invalid coordinates for site: ${site}`);
            return; // Skip this iteration if coordinates are invalid
        }

        // Get the latest data for the parameters (last entry in the array)
        const latestDateTime = DateTime[DateTime.length - 1];
        const latestHsig = Hsig[Hsig.length - 1];
        const latestHmax = Hmax[Hmax.length - 1];
        const latestTp = Tp[Tp.length - 1];
        const latestTz = Tz[Tz.length - 1];
        const latestDirection = Direction[Direction.length - 1];

        // code for a permamnet popup when site is clicked
        // // Create a circle marker with default color - with permament popup for clicked site
        // const marker = L.circleMarker([Latitude, Longitude], {
        //     radius: 8,
        //     fillColor: defaultColor,
        //     color: defaultColor,
        //     weight: 1,
        //     opacity: 1,
        //     fillOpacity: 0.8
        // }).addTo(map)
        //     .bindPopup(`
        //         <strong>${site}</strong><br>
        //         <br>
        //         <u>Latest Data</u><br>
        //         Last Updated: ${latestDateTime}<br>
        //         H<sub>sig</sub>: ${latestHsig.toFixed(2)} m<br>
        //         H<sub>max</sub>: ${latestHmax.toFixed(2)} m<br>
        //         T<sub>p</sub>: ${latestTp.toFixed(2)} s<br>
        //         T<sub>z</sub>: ${latestTz.toFixed(2)} s<br>
        //         Direction: ${latestDirection.toFixed(1)} &deg;N<br>
        //         Latitude: ${Latitude.toFixed(4)} &deg;N<br>
        //         Longitude: ${Longitude.toFixed(4)} &deg;E
        //     `) // Popup with the latest data
        //     .on('click', () => {
        //         // Change the marker color on click
        //         selectSite(site);
        //     });

        // Create a circle marker with default color
        const marker = L.circleMarker([Latitude, Longitude], {
            radius: 8,
            fillColor: defaultColor,
            color: defaultColor,
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8
        }).addTo(map)
            .on('click', () => {
                // Change the marker color on click
                selectSite(site);
            });
            
        // Add hover tooltip with lat, lon, and latest values
        const tooltipContent = `
            <strong>${site}</strong><br>
            <br>
            <u>Latest Data</u><br>
            Last Updated: ${latestDateTime}<br>
            H<sub>sig</sub>: ${latestHsig.toFixed(2)} m<br>
            H<sub>max</sub>: ${latestHmax.toFixed(2)} m<br>
            T<sub>p</sub>: ${latestTp.toFixed(2)} s<br>
            T<sub>z</sub>: ${latestTz.toFixed(2)} s<br>
            Direction: ${latestDirection.toFixed(1)} &deg;N<br>
            Latitude: ${Latitude.toFixed(4)} &deg;N<br>
            Longitude: ${Longitude.toFixed(4)} &deg;E
        `;

        marker.bindTooltip(tooltipContent, { permanent: false, direction: 'auto' , opacity: 0.8});

        markers[site] = marker; // Store marker for later reference
    });

    // Function to reset and select a marker
    function selectSite(selectedSite) {
        // Reset all markers to defaultColor
        Object.keys(markers).forEach(site => {
            markers[site].setStyle({
                fillColor: defaultColor,
                color: defaultColor
            });
        });

        // Change the selected marker to selectedColor
        const selectedMarker = markers[selectedSite];
        selectedMarker.setStyle({
            fillColor: selectedColor,
            color: selectedColor
        });

        // Bring the selected marker to the front
        selectedMarker.bringToFront();

        // Open the popup for the selected site
        selectedMarker.openPopup();
        
        // Plot data for the selected site
        plotData(groupedData, selectedSite);
    }

    // Automatically plot data for the southernmost site on page load
    if (southernmostSite) {
        selectSite(southernmostSite); // Plot the southernmost site and change its marker color
    }
}

// Initial function to load data and plot on page load
document.addEventListener('DOMContentLoaded', async function () {
    const csvData = await downloadData();
    const parsedData = parseCSV(csvData);
    const groupedData = groupBySite(parsedData);
    createMap(groupedData); // Create the map
});

// page loading
async function downloadData() {
    document.getElementById('loading').style.display = 'flex'; // Show loading spinner
    const url = 'https://apps.des.qld.gov.au/data-sets/waves/wave-7dayopdata.csv';
    const response = await fetch(url);
    const data = await response.text();
    document.getElementById('loading').style.display = 'none'; // Hide loading spinner
    return data;
}

document.addEventListener('DOMContentLoaded', async function () {
    document.getElementById('loading').style.display = 'flex'; // Show loading spinner
    const csvData = await downloadData();
    const parsedData = parseCSV(csvData);
    const groupedData = groupBySite(parsedData);
    createMap(groupedData); // Create the map
    document.getElementById('loading').style.display = 'none'; // Hide loading spinner
});
