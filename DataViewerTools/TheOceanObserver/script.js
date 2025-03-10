// Function to initialize the map
function initialiseMap() {
    return fetch('http://ip-api.com/json/')
        .then(response => response.json())
        .then(data => {
            const latitudeUser = parseFloat(data.lat);
            const longitudeUser = parseFloat(data.lon);

            // Create map centered on user's location
            const map = L.map('map').setView([latitudeUser, longitudeUser], 5);

            // Map base layer
            L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '&copy; <a href="https://www.esri.com/">Esri</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            }).addTo(map);

            return map;  // Return the map object to be used later
        })
        .catch(error => {
            console.error('Error fetching location:', error);
        });
}

// Helper function to filter out -99.9 values before plotting
function filterData(data) {
    return data.map(value => (value === -99.9 ? null : value));
}

// Function to download CSV and process the data
var iconWaveBuoy = L.icon({
    iconUrl: '.\\images\\water-level.png',  // Path to your custom image
    iconSize: [32, 32],          // Size of the icon [width, height]
    iconAnchor: [16, 32],        // Point of the icon that corresponds to the marker's location
    popupAnchor: [0, -32]        // Point where the popup opens relative to the icon
});

var squareIcon = L.divIcon({
    className: 'custom-square',
    iconSize: [20, 20]  // Width & Height of the square
});

async function downloadAndPlot_QldWaveData(map, groupings) {
    // Step 1: Fetch the CSV file from the URL
    const response = await fetch('https://apps.des.qld.gov.au/data-sets/waves/wave-7dayopdata.csv');
    const data = await response.text();

    // Step 2: Parse the CSV data
    const rows = data.split('\n');

    // Step 3: Store the column headers into an array
    // Row 2 contains the column headers (index 1)
    const headers = rows[1].split(',').map(header => header.trim());  // Trim spaces from headers
    // console.log("Headers:", headers);

    // Step 4: Group the data by the "Site" column and store each column's data separately
    const siteData = {};

    // Loop through each row starting from row 3 (i = 2) and group by "Site"
    for (let i = 2; i < rows.length; i++) {
        const row = rows[i].split(',');

        // Skip empty rows (e.g., last row after splitting)
        if (row.length < headers.length) continue;

        // Get the site name (assuming "Site" is the first column)
        const site = row[headers.indexOf('Site')];

        // Skip invalid rows if there is no valid site
        if (!site) continue;

        // Store each column's data separately for the site
        if (!siteData[site]) {
            siteData[site] = {};
        }

        // Loop through each column and store the value for the site
        headers.forEach((header, index) => {
            siteData[site][header] = siteData[site][header] || []; // Initialize the array for each column
            siteData[site][header].push(row[index]); // Store the value for the column
        });
    }

    // Add a marker for each site's average lat, lon
    Object.keys(siteData).forEach(site => {
        console.log(site)
        // Extract lat, lon, and DateTime data
        const latValues = siteData[site]['Latitude'];
        const lonValues = siteData[site]['Longitude'];
        const dateTimes = siteData[site]['DateTime'];

        // Calculate the average lat, lon for each site from all rows
        let latSum = 0, lonSum = 0, count = 0;
        latValues.forEach((lat, index) => {
            const lon = lonValues[index];
            const latNum = parseFloat(lat);
            const lonNum = parseFloat(lon);
            if (!isNaN(latNum) && !isNaN(lonNum)) {
                latSum += latNum;
                lonSum += lonNum;
                count++;
            }
        });

        if (count > 0) {
            const avgLat = latSum / count;
            const avgLon = lonSum / count;

            // // Add a marker to the map
            // const marker = L.marker([avgLat, avgLon], {
            //     icon: iconWaveBuoy})
            //     .addTo(map)
            //     .bindTooltip(`<b>${site}</b><br>Latitude: ${avgLat.toFixed(4)}<br>Longitude: ${avgLon.toFixed(4)}`);
            const marker = L.marker([avgLat, avgLon], { icon: squareIcon }).addTo(map);
            // Define subplot groupings
            
            const groupings = [
                ["Hsig", "Hmax"], 
                ["Tp","Tz",],
                ["SST"],
                ["Direction"],
                ["Current Speed","Current Direction"],
            ];
            
            // Add click event to the marker
            marker.on('click', function () {
                const dateTimesConverted = dateTimes.map(date => new Date(date));
                const traces = [];
                let subplotIndex = 1;
            
                // Create subplots based on groupings
                groupings.forEach(group => {
                    if (Array.isArray(group)) {
                        group.forEach(variable => {
                            const columnData = siteData[site][variable].map(value => parseFloat(value));
                            const validData = columnData.filter(value => !isNaN(value));
            
                            if (validData.length > 0) {
                                traces.push({
                                    x: dateTimesConverted.slice(0, validData.length),
                                    y: filterData(validData),
                                    type: 'scatter',
                                    mode: 'lines',
                                    name: variable,
                                    xaxis: `x${subplotIndex}`,
                                    yaxis: `y${subplotIndex}`
                                });
                            }
                        });
                    } else {
                        const columnData = siteData[site][group].map(value => parseFloat(value));
                        const validData = columnData.filter(value => !isNaN(value));
            
                        if (validData.length > 0) {
                            traces.push({
                                x: dateTimesConverted.slice(0, validData.length),
                                y: filterData(validData),
                                type: 'scatter',
                                mode: 'lines',
                                name: group,
                                xaxis: `x${subplotIndex}`,
                                yaxis: `y${subplotIndex}`
                            });
                        }
                    }
                    subplotIndex++;
                });
            
                const layout = {
                    title: {
                        text: `Site: ${site}`,
                        font: { color: 'white' } // Title in white
                    },
                    grid: { rows: groupings.length, columns: 1, pattern: 'independent' },
                
                    paper_bgcolor: '#222',  // Dark background for the entire plot container
                    plot_bgcolor: '#1e1e1e', // Dark background inside the plot area
                
                    font: { color: 'white' }, // White font for labels
                
                    xaxis: {
                        title: 'DateTime',
                        // tickformat: '%Y-%m-%d %H:%M:%S',
                        color: 'white', // White axis labels
                        gridcolor: '#444', // Dark gray gridlines
                        zerolinecolor: '#666', // Zero line color
                    },
                
                    yaxis: {
                        title: 'Value',
                        color: 'white', // White axis labels
                        gridcolor: '#444', // Dark gray gridlines
                        zerolinecolor: '#666', // Zero line color
                    },
                
                    showlegend: true,
                    legend: {
                        font: { color: 'white' }, // Legend text in white
                        bgcolor: '#1e1e1e', // Dark legend background
                        bordercolor: '#444',
                        borderwidth: 1
                    },
                
                    height: 680,
                    margin: { l: 60, r: 20, t: 30, b: 50 }
                };
                
            
                // Remove existing popup if open
                const existingPopup = document.getElementById('custom-popup');
                if (existingPopup) {
                    existingPopup.remove();
                }
            
                // Create the popup div
                const popupDiv = document.createElement('div');
                popupDiv.id = 'custom-popup';
                popupDiv.classList.add('draggable-popup'); // Add CSS class
            
                // Create a close button
                const closeButton = document.createElement('button');
                closeButton.innerText = 'Close';
                closeButton.classList.add('close-btn'); // Apply CSS class
                closeButton.onclick = () => popupDiv.remove();
            
                // Create a div inside the popup to hold the plot
                const plotDiv = document.createElement('div');
                plotDiv.id = 'plotly-plot';
            
                // Append elements
                popupDiv.appendChild(closeButton);
                popupDiv.appendChild(plotDiv);
                document.body.appendChild(popupDiv);
            
                // Render the plot inside the popup
                Plotly.newPlot(plotDiv, traces, layout);
            
                // Make the popup draggable
                // makeDraggable(popupDiv);

                // Use setTimeout to delay adding the event listener
                setTimeout(() => {
                    document.addEventListener('click', function closePopupOutside(event) {
                        if (!popupDiv.contains(event.target)) {
                            popupDiv.remove();
                            document.removeEventListener('click', closePopupOutside); // Remove listener after closing
                        }
                    });
                }, 100); // Short delay to allow popup to be added first

            });
            
        }
    });
}

function makeDraggable(element) {
    let isDragging = false;
    let startX, startY, initialX, initialY;

    element.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        initialX = element.offsetLeft;
        initialY = element.offsetTop;

        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDragging);
    });

    function drag(e) {
        if (!isDragging) return;
        let dx = e.clientX - startX;
        let dy = e.clientY - startY;
        element.style.left = `${initialX + dx}px`;
        element.style.top = `${initialY + dy}px`;
    }

    function stopDragging() {
        isDragging = false;
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', stopDragging);
    }
}

// Page call listeners and controls
document.addEventListener('DOMContentLoaded', async function () {
    // Initialise Map
    const map = await initialiseMap();

    // Qld Wave Data
    downloadAndPlot_QldWaveData(map);  // Pass the groupings parameter to the function

    // Qld Tide Data
    // downloadAndPlot_QldTideData(map);  // Pass the groupings parameter to the function
});
