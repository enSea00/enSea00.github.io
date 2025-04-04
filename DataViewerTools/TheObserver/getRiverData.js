// Function to fetch and parse the HTML table from the URL
window.fetchAndParseTable = async function (url) {
    try {
        // Replace "plt" with "tbl" in the URL
        const modifiedUrl = url.replace("plt", "tbl");

        // Define request headers (customize as needed)
        const headers = {
            "Accept": "text/html",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
        };

        // Fetch the modified URL with headers
        const response = await fetch(modifiedUrl, {
            method: "GET",
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const htmlText = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        // Select the table with class "tabledata rhb"
        const table = doc.querySelector(".tabledata.rhb tbody");
        if (!table) {
            console.error("Table not found in the fetched HTML!");
            return null;
        }

        let timestamps = [];
        let waterLevels = [];

        // Extract data from table rows
        table.querySelectorAll("tr").forEach(row => {
            const cols = row.querySelectorAll("td");
            if (cols.length === 2) {
                timestamps.push(cols[0].textContent.trim()); // Date/Time
                waterLevels.push(parseFloat(cols[1].textContent.trim())); // Water Level
            }
        });

        return { timestamps, waterLevels };
    } catch (error) {
        console.error("Error fetching or parsing the table:", error);
        return null;
    }
};


// Function to create a Plotly plot
function createPlot(timestamps, waterLevels) {
    const trace = {
        x: timestamps,
        y: waterLevels,
        type: "scatter",
        mode: "lines+markers",
        marker: { color: "blue" },
        line: { shape: "spline" }
    };

    const layout = {
        title: "River Water Level",
        xaxis: { title: "Date/Time" },
        yaxis: { title: "Water Level (m)", autorange: true }
    };

    const plotDiv = document.createElement("div");
    plotDiv.style.width = "400px"; 
    plotDiv.style.height = "300px"; 

    Plotly.newPlot(plotDiv, [trace], layout);

    return plotDiv;
}


