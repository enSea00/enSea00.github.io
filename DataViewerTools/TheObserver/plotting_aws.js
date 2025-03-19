async function fetchAndPlotWeatherData(url) {
    try {
        // Use a CORS proxy to bypass restrictions
        // let corsProxy = "https://cors-anywhere.herokuapp.com/";
        let corsProxy = "https://api.allorigins.win/raw?url="; 
        let fullUrl = corsProxy + encodeURIComponent(url);

        // let fullUrl = corsProxy + url;

        let response = await fetch(fullUrl, {
            method: "GET",
            headers: {
                "Accept": "text/html",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36"
            }
        });

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        let text = await response.text();
        console.log(text)
        // Create a temporary DOM parser
        let parser = new DOMParser();
        let doc = parser.parseFromString(text, "text/html");

        // Extract table rows
        let rows = doc.querySelectorAll("#t1 tbody tr");

        let time = [], temp = [], appTemp = [], dewPoint = [], 
            windSpeedKm = [], windGustKm = [], windSpeedKts = [], windGustKts = [],
            pressureQNH = [], pressureMSL = [];

        rows.forEach(row => {
            let cells = row.querySelectorAll("td");
            if (cells.length < 13) return; // Skip invalid rows

            time.push(cells[0].textContent.trim());
            temp.push(parseFloat(cells[1].textContent.trim()));
            appTemp.push(parseFloat(cells[2].textContent.trim()));
            dewPoint.push(parseFloat(cells[3].textContent.trim()));
            windSpeedKm.push(parseFloat(cells[7].textContent.trim()));
            windGustKm.push(parseFloat(cells[8].textContent.trim()));
            windSpeedKts.push(parseFloat(cells[9].textContent.trim()));
            windGustKts.push(parseFloat(cells[10].textContent.trim()));
            pressureQNH.push(parseFloat(cells[11].textContent.trim()));
            pressureMSL.push(parseFloat(cells[12].textContent.trim()));
        });
        
        // Create the plot
        createPlotPopup(time, temp, appTemp, dewPoint, windSpeedKm, windGustKm, windSpeedKts, windGustKts, pressureQNH, pressureMSL);
    } catch (error) {
        console.error("Error fetching or processing data:", error);
    }
}

// Function to create the plot popup
function createPlotPopup(time, temp, appTemp, dewPoint, windSpeedKm, windGustKm, windSpeedKts, windGustKts, pressureQNH, pressureMSL) {
    let unit = "km/h";

    function plotGraph() {
        let windSpeed = unit === "km/h" ? windSpeedKm : windSpeedKts;
        let windGust = unit === "km/h" ? windGustKm : windGustKts;

        let traces = [
            { x: time, y: temp, mode: "lines", name: "Temperature (°C)", line: { color: "red" } },
            { x: time, y: appTemp, mode: "lines", name: "Apparent Temp (°C)", line: { color: "orange" } },
            { x: time, y: dewPoint, mode: "lines", name: "Dew Point (°C)", line: { color: "blue" } }
        ];

        let windTraces = [
            { x: time, y: windSpeed, mode: "lines", name: `Wind Speed (${unit})`, line: { color: "green" } },
            { x: time, y: windGust, mode: "lines", name: `Wind Gust (${unit})`, line: { color: "darkgreen" } }
        ];

        let pressureTraces = [
            { x: time, y: pressureQNH, mode: "lines", name: "Pressure QNH (hPa)", line: { color: "purple" } },
            { x: time, y: pressureMSL, mode: "lines", name: "Pressure MSL (hPa)", line: { color: "brown" } }
        ];

        let layout = {
            title: "Weather Data Time Series",
            xaxis: { title: "Time" },
            yaxis: { title: "Temperature (°C)" },
            yaxis2: { title: `Wind Speed (${unit})`, overlaying: "y", side: "right" },
            yaxis3: { title: "Pressure (hPa)", overlaying: "y", side: "right" },
            grid: { rows: 3, columns: 1, pattern: "independent" }
        };

        Plotly.newPlot("popupPlot", [...traces, ...windTraces, ...pressureTraces], layout);
    }

    // Create popup overlay
    let popup = document.createElement("div");
    popup.id = "plotPopup";
    popup.innerHTML = `
        <div id="popupContent">
            <span id="closePopup" onclick="document.body.removeChild(document.getElementById('plotPopup'))">&times;</span>
            <h3>Weather Data</h3>
            <button id="toggleWindUnit">Toggle Wind Unit</button>
            <div id="popupPlot"></div>
        </div>
    `;
    document.body.appendChild(popup);

    // Style the popup
    let style = document.createElement("style");
    style.textContent = `
        #plotPopup { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        #popupContent { background: white; padding: 20px; border-radius: 8px; position: relative; width: 80%; max-width: 800px; }
        #closePopup { position: absolute; top: 10px; right: 15px; font-size: 24px; cursor: pointer; }
        #toggleWindUnit { margin-bottom: 10px; padding: 5px 10px; }
    `;
    document.head.appendChild(style);

    // Initial plot
    plotGraph();

    // Toggle wind unit button
    document.getElementById("toggleWindUnit").addEventListener("click", () => {
        unit = unit === "km/h" ? "kts" : "km/h";
        plotGraph();
    });
}
