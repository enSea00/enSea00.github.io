// BoM Standard values for durations and AEP
const durations = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30, 45, 60, 90, 120, 180, 270, 360, 540, 720, 1080, 1440, 1800, 2160, 2880, 4320, 5760, 7200, 8640, 10080]; // (minutes)
const AEPs = [50, 20, 10, 5, 2, 1, 0.5, 0.2, 0.1, 0.05]; // (%)

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Download ARR Data hub json file for a given location 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// Download data hub data ////////////////////////////////////////

function downloadDataHubData(latitude, longitude) {

    // Using a CORS proxy to overcome fetch connection issues with the data hub
    // var url = `https://data.arr-software.org/?lon_coord=${longitude}&lat_coord=${latitude}&type=json&All=1`;
    // var url = `https://thingproxy.freeboard.io/fetch/https://data.arr-software.org/?lon_coord=${longitude}&lat_coord=${latitude}&type=json&All=1`;
    var url = `https://cors-anywhere.herokuapp.com/https://data.arr-software.org/?lon_coord=${longitude}&lat_coord=${latitude}&type=json&All=1`;
    // var url = `https://corsproxy.io/https://data.arr-software.org/?lon_coord=${longitude}&lat_coord=${latitude}&type=json&All=1`;
    console.log(url)


    // Trigger the fetch request
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            return response.json(); // Parse the JSON
        })
        .then(data => {
            // Store the JSON data
            dataHubData = data;

            // Display the data in the console
            console.log('Fetched Data:', dataHubData);

            // Call your calculation functions here
            performCalculations();
        })
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error);
        });
}

// Initialize an empty array to store all JSON data
let dataHubData = [];

function processTableData() {
    // Loop through each entry in the tableData array
    for (let i = 0; i < tableData.length; i++) {
        const entry = tableData[i];

        // Extract latitude and longitude from the entry
        const longitude = parseFloat(entry.longitude); // Centroid Longitude
        const latitude = parseFloat(entry.latitude);   // Centroid Latitude
        const area = parseFloat(entry.area);   // subbasin area

        // Call the downloadDataHubData function for each entry
        downloadDataHubData(latitude, longitude);
    }
}


// Function to perform calculations
// Function to perform calculations
function performCalculations() {
    if (dataHubData) {
        // Compute ARFs
        const coefficients = parseARFcoefficients(dataHubData);
        console.log(coefficients);

        // Loop through tableData to get areas
        for (let i = 0; i < tableData.length; i++) {
            const entry = tableData[i];
            const area = parseFloat(entry.area); // Assuming area is stored in 'area' property

            // Calculate ARF for each area
            const ARF2DArray = computeARFArray(area, coefficients);
            generateARFTable(coefficients.Zone, area); // <-- Update the table for each area
            
            // Additional logic can be added here if needed for spatial patterns
        }
        
    } else {
        console.log('No data available for calculations.');
    }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Compute Areal Reduction Factors (ARF) 
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// parse ARF coefficienst from downloaded data hub data
function parseARFcoefficients(dataHubData) {
    const longarfData = dataHubData.layers.ARFParams;

    if (!longarfData) {
        console.error("layers.ARFParams data not found in the JSON");
        return null;
    }

    // Extract the coefficients directly
    const arfParameters = {
        Zone: longarfData.Zone || "Unknown Zone", // default to 'Unknown Zone' if not provided
        a: longarfData.a,
        b: longarfData.b,
        c: longarfData.c,
        d: longarfData.d,
        e: longarfData.e,
        f: longarfData.f,
        g: longarfData.g,
        h: longarfData.h,
        i: longarfData.i
    };

    return arfParameters;
}

// Computes the areal reduction factor based on ARR Book 2, Chapter 4 (Equation 241).
function equation241(area, duration, AEP) {
    const ARF = Math.min(
        1,
        1 - 0.287 * (Math.pow(area, 0.265) - 0.439 * Math.log10(duration)) * Math.pow(duration, -0.36) +
            2.26 * Math.pow(10, -3) * Math.pow(area, 0.226) * Math.pow(duration, 0.125) * (0.3 + Math.log10(AEP)) +
            0.0141 * Math.pow(area, 0.213) * Math.pow(10, (-0.021 * Math.pow(duration - 180, 2) / 1440)) * (0.3 + Math.log10(AEP))
        );

    return ARF;
}

// Computes the areal reduction factor based on ARR Book 2, Chapter 4 (Equation 242).
function equation242(Area, Duration, AEP, coefficients) {
    const { a, b, c, d, e, f, g, h, i } = coefficients;

    const ARF = Math.min(
        1,
        1 - a * (Math.pow(Area, b) - c * Math.log10(Duration)) * Math.pow(Duration, -d) +
            e * Math.pow(Area, f) * Math.pow(Duration, g) * (0.3 + Math.log10(AEP)) +
            h * Math.pow(10, i * Area * Duration / 1440) * (0.3 + Math.log10(AEP))
    );

    return ARF;
}

// Computes the areal reduction factor based on ARR Book 2, Chapter 4 (Equation 243).
function equation243(duration, ARF_12hr, ARF_24hr) {
    const ARF = ARF_12hr + (ARF_24hr - ARF_12hr) * (duration - 720) / 720;
    return ARF;
}

// Computes the areal reduction factor based on ARR Book 2, Chapter 4 (Equation 244).
function equation244(area, ARF_10km2) {
    const ARF = 1 - 0.6614 * (1 - ARF_10km2) * (Math.pow(area, 0.4) - 1);
    return ARF;
}

// Main function to compute the areal reduction factor.
function computeARF(area, duration, AEP, coefficients) {
    let ARF;

    if (area <= 1) {
        ARF = 1;
    } else if (area > 1 && area <= 10 && duration <= 12 * 60) {
        const ARF_10km2 = equation241(10, duration, AEP);
        ARF = equation244(area, ARF_10km2);
    } else if (area > 10 && area <= 1000 && duration <= 12 * 60) {
        ARF = equation241(area, duration, AEP);
    } else if (area > 1000 && duration <= 12 * 60) {
        ARF = NaN;
    } else if (area > 1 && area <= 10 && duration > 12 * 60 && duration < 24 * 60) {
        const ARF_10km2_24hr = equation242(10, 1440, AEP, coefficients);
        const ARF_10km2_12hr = equation241(10, 720, AEP);
        const ARF_10km2 = equation243(duration, ARF_10km2_12hr, ARF_10km2_24hr);
        ARF = equation244(area, ARF_10km2);
    } else if (area > 10 && area <= 30000 && duration > 12 * 60 && duration < 24 * 60) {
        const ARF_24hr = equation242(area, 1440, AEP, coefficients);
        const ARF_12hr = equation241(area, 720, AEP);
        ARF = equation243(duration, ARF_12hr, ARF_24hr);
    } else if (area > 1 && area <= 10 && duration >= 24 * 60) {
        const ARF_10km2 = equation242(10, duration, AEP, coefficients);
        ARF = equation244(area, ARF_10km2);
    } else if (area > 10 && area <= 30000 && duration >= 24 * 60) {
        ARF = equation242(area, duration, AEP, coefficients);
    } else {
        ARF = NaN;
    }

    if (ARF < 0) {
        ARF = 0;
    }

    return ARF;
}

// Function to compute and store the 2D array of ARF
let ARFArray = []; // Global variable to store the 2D array of ARF values
function computeARFArray(area, coefficients) {
    // Initialize the 2D array
    ARFArray = [];

    // Loop over AEPs and durations to compute ARF
    for (let i = 0; i < AEPs.length; i++) {
        const AEP = AEPs[i]/100;
        let row = []; // Row to store ARF for each duration at this AEP

        for (let j = 0; j < durations.length; j++) {
            const duration = durations[j]; 
            const ARF = computeARF(area, duration, AEP, coefficients);

            row.push(ARF); // Store the ARF value in the row
        }

        ARFArray.push(row); // Store the row in the 2D array
    }

    console.log('ARF 2D Array:', ARFArray);

    return ARFArray;
}

// Function to generate ARF table as HTML and insert it into the ARF tab
function generateARFTable(zone, area) {
    const tableContainer = document.getElementById('arfTableContainer');
    const arfZone = document.getElementById("arfZone");
    const arfArea = document.getElementById("arfArea");

    console.log('Generating Transposed ARF Table:', ARFArray);

    if (!ARFArray || ARFArray.length === 0) {
        tableContainer.innerHTML = '<p>No data available to display.</p>';
        return;
    }

    // Set the title using the Zone
    arfZone.textContent = `ARF Zone: ${zone}`;
    arfArea.textContent = `Area (km2): ${area}`;
    let html = '<table border="1"><thead><tr><th>Duration (min) / AEP (%)</th>';

    // Add headers for AEPs (these become the new columns)
    for (let i = 0; i < AEPs.length; i++) {
        html += `<th>${AEPs[i]}%</th>`;
    }
    html += '</tr></thead><tbody>';

    // Add transposed ARF data rows where durations are rows and AEPs are columns
    for (let j = 0; j < durations.length; j++) {
        html += `<tr><td>${durations[j]}</td>`;
        for (let i = 0; i < AEPs.length; i++) {
            html += `<td>${ARFArray[i][j].toFixed(4)}</td>`;
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    tableContainer.innerHTML = html;
}

// Donloaded computed ARFs as a csv file
function downloadARF() {
    const coefficients = parseARFcoefficients(dataHubData)
    zone = coefficients.Zone
    const area = parseFloat(document.getElementById("area").value);
    const table = document.querySelector('#arfTableContainer table');
    if (!table) {
        alert("No ARF table available for download.");
        return;
    }

    let csvContent = `Areal Reduction Factors \n Zone,${zone}\nArea,${area}\n\n`; // Adding Zone and Area headers at the top
    const rows = table.querySelectorAll("tr");

    rows.forEach(row => {
        const cols = row.querySelectorAll("td, th");
        const rowData = Array.from(cols).map(col => col.innerText).join(",");
        csvContent += rowData + "\r\n"; // Add line break after each row
    });

    // Create a Blob from the CSV content
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "ARF_Table.csv"); // Set the filename for the downloaded CSV
    document.body.appendChild(link); // Required for Firefox

    link.click(); // Trigger the download
    document.body.removeChild(link); // Clean up
}

//////////////////////////////////////////////////////////////////