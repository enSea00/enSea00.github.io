async function fetchAndStoreCSV(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Failed to fetch CSV: ${response.statusText}`);

        const csvText = await response.text();
        const data = parseCSV(csvText);

        console.log("CSV Data Stored:", data); // Check the parsed data

        return data; // Store for later use
    } catch (error) {
        console.error("Error fetching CSV:", error);
        return null;
    }
}

// Function to parse CSV text into an array of objects
function parseCSV(csvText) {
    const rows = csvText.split("\n").map(row => row.trim()).filter(row => row.length > 0);
    const headers = rows[0].split(",").map(header => header.trim());

    return rows.slice(1).map(row => {
        const values = row.split(",").map(value => value.trim());
        return Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    });
}

// Run on page load
window.onload = function () {
    const csvUrl = 'https://apps.des.qld.gov.au/data-sets/waves/wave-7dayopdata.csv'; // Replace with actual CSV URL
    fetchAndStoreCSV(csvUrl).then(data => {
        if (data) {
            console.log("Data ready for plotting:", data);
            // You can call a plotting function here if needed
        }
    });
};
