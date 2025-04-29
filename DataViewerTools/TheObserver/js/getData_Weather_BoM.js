async function getData_Weather_BoM(loc) {

    // the json_file here is batch downloaded using python and github scheduling 
    const json_file = 'https://raw.githubusercontent.com/enSea00/enSea00.github.io/main/DataViewerTools/TheObserver/data/BoM/aws_json/' +
        loc.URL.split('/').pop().replace('shtml', 'json');

    try {

        // load the clicked station's data from the json_file
        const response = await fetch(json_file);
        const parsed = await response.json();

        let observations = parsed?.observations?.data;
        if (!observations || observations.length === 0) {
            console.warn('No observation data found.');
            return null;
        }
        console.log(observations)
        // map from raw cardinal wind direction to degN
        const compassToDegrees = {
            N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
            E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
            S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
            W: 270, WNW: 292.5, NW: 315, NNW: 337.5
        };
        
        // function to parse date
        function parseDateTime(YYYMMDDhhmmssStr) {
            const year = parseInt(YYYMMDDhhmmssStr.slice(0, 4), 10);
            const month = parseInt(YYYMMDDhhmmssStr.slice(4, 6), 10) - 1; // Month is 0-indexed
            const day = parseInt(YYYMMDDhhmmssStr.slice(6, 8), 10);
            const hour = parseInt(YYYMMDDhhmmssStr.slice(8, 10), 10);
            const minute = parseInt(YYYMMDDhhmmssStr.slice(10, 12), 10);
            const second = parseInt(YYYMMDDhhmmssStr.slice(12, 14), 10);
          
            return new Date(year, month, day, hour, minute, second);
        }

        // apply the mapping to directions and convert DateTime to a timestamp
        observations = observations.map(obs => {
            const newObs = { ...obs }; // clone to avoid mutating original
        
            for (const [key, value] of Object.entries(obs)) {
                if (key === "local_date_time_full") {
                    newObs.timestamp = parseDateTime(value); // Add timestamp
                } else if (key === "wind_dir") {
                    const deg = compassToDegrees[value];
                    if (deg !== undefined) {
                        newObs[key] = deg; // Replace with degrees
                    }
                }
            }
            return newObs; // <--- THIS was missing
        });
        
        // map from raw variable names to print-friendly names - the strings 
        const variableNameMap = {
            local_date_time_full: "DateTime",
            air_temp: "T<sub>a</sub> (°C)",
            dewpt: "T<sub>d</sub> (°C)",
            apparent_t: "T<sub>app</sub> (°C)",
            rel_hum: "R<sub>h</sub> (%)",
            wind_dir: "Wind Dir (°N)",
            wind_spd_kmh: "Wind Spd (km/h)",
            gust_kmh: "Wind Gust (km/h)",
            rain_trace: "Rain (mm)",
            press: "P (hPa)",
            press_msl: "P<sub>MSL</sub> (hPa)",
            press_qnh: "P<sub>QNH</sub> (hPa)",
        };
        
        // define subplot groups (variables sharing same subplot axes)
        let subplotGroups = [
            ["T<sub>a</sub> (°C)", "T<sub>d</sub> (°C)", "T<sub>app</sub> (°C)"],
            ["R<sub>h</sub> (%)"],
            ["Wind Dir (°N)"],
            ["Wind Spd (km/h)","Wind Gust (km/h)"],
            ["Rain (mm)"],
            ["P (hPa)", "P<sub>MSL</sub> (hPa)","P<sub>QNH</sub> (hPa)"]
        ]

        // make the plotly plot
        const { traces, layout } = createTimeseriesSubplots(observations, variableNameMap, subplotGroups, loc);

        // make the plot overlay
        const customAttribution = `
            <p>This data is provided by the 
            <a href="http://www.bom.gov.au/" target="_blank">Australian Bureau of Meteorology, Commonwealth of Australia</a>
            under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons license (CC BY 4.0)</a>.</p>
            <p>For more information refer to their <a href="http://www.bom.gov.au/other/disclaimer.shtml" taret="_blank">Disclaimer</a> and <a href="http://www.bom.gov.au/other/copyright.shtml" target="_blanbk">Copyright</a> information.</p>`;
        
        showPlotOverlay(traces, layout, loc, customAttribution);
        
        return;

    } catch (error) {
        console.error("Failed to load or parse JSON:", error);
        return null;
    }
}
