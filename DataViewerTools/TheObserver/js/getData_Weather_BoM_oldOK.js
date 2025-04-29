async function getData_Weather_BoM(loc) {

    // the json_file here is batch downloaded using python and github scheduling 
    const json_file = 'https://raw.githubusercontent.com/enSea00/enSea00.github.io/main/DataViewerTools/TheObserver/data/BoM/aws_json/' +
        loc.URL.split('/').pop().replace('shtml', 'json');

    // console.log("Fetching:", json_file);
    // console.log(loc.URL);

    try {

        // load the clicked station's data
        const response = await fetch(json_file);
        const parsed = await response.json();

        const observations = parsed?.observations?.data;
        console.log(observations)
        if (!observations || observations.length === 0) {
            console.warn('No observation data found.');
            return null;
        }
        
        // map from raw cardinal wind direction to degN
        const compassToDegrees = {
            N: 0, NNE: 22.5, NE: 45, ENE: 67.5,
            E: 90, ESE: 112.5, SE: 135, SSE: 157.5,
            S: 180, SSW: 202.5, SW: 225, WSW: 247.5,
            W: 270, WNW: 292.5, NW: 315, NNW: 337.5
        };
        
        // Groups and units to retain and plot (if data is available)
        let groups = [
            ['air_temp', 'dewpt', 'apparent_t'],
            ['rel_hum'],
            ['wind_dir'],
            ['wind_spd_kmh', 'gust_kmh'],
            ['rain_trace'],
            ['press', 'press_msl', 'press_qnh']
        ];
        
        let units = {
            air_temp: '°C',
            dewpt: '°C',
            apparent_t: '°C',
            rel_hum: '%',
            wind_dir: '°N',
            wind_spd_kmh: 'km/h',
            gust_kmh: 'km/h',
            rain_trace: 'mm',
            press: 'hPa',
            press_msl: 'hPa',
            press_qnh: 'hPa'
        };
        
        // Build initial data container
        const allGroupKeys = new Set(groups.flat());
        const data = { time: [] };
        allGroupKeys.forEach(k => data[k] = []);
        
        for (const obs of observations) {
            const local = obs.local_date_time_full;
            if (local && local.length === 14) {
                const localStr = `${local.slice(0, 4)}-${local.slice(4, 6)}-${local.slice(6, 8)}T${local.slice(8, 10)}:${local.slice(10, 12)}:${local.slice(12, 14)}`;
                data.time.push(localStr); // No Date object, no UTC shift
            } else {
                data.time.push(null);
            }
        
            allGroupKeys.forEach(k => {
                let val = obs[k];
                if (k === 'wind_dir' && typeof val === 'string') {
                    val = compassToDegrees[val.toUpperCase()] ?? null;
                }
                data[k].push((val !== undefined && val !== '-') ? val : null);
            });
        }
        
        // Remove keys with all nulls or all NaNs
        const removedKeys = new Set();
        for (const key of allGroupKeys) {
            const values = data[key];
            if (!values || values.every(v => v === null || v === '-' || isNaN(v))) {
                removedKeys.add(key);
                delete data[key];
                delete units[key];
            }
        }
        
        // Filter groups to remove missing keys
        groups = groups
            .map(group => group.filter(k => !removedKeys.has(k)))
            .filter(group => group.length > 0);


        // plotting
        // Truncate to N most recent days
        const N = 7;
        const now = new Date();
        const pad = n => String(n).padStart(2, '0');
        const cutoffLocalStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate() - N)}T00:00:00`;
        
        const entries = data.time.map((t, i) => {
            const entry = { timestamp: t }; // keep as string!
            Object.keys(data).forEach(key => {
                if (key !== 'time') {
                    entry[key] = data[key][i];
                }
            });
            return entry;
        });
        
        // Use string comparison instead of Date
        const filteredEntries = entries.filter(d => d.timestamp >= cutoffLocalStr);

        // Convert back to object of arrays
        const filteredData = { time: [] };
        Object.keys(data).forEach(k => {
            if (k !== 'time') filteredData[k] = [];
        });

        // Populate filteredData
        filteredEntries.forEach(entry => {
            filteredData.time.push(entry.timestamp);
            Object.keys(entry).forEach(k => {
                if (k !== 'timestamp') {
                    filteredData[k].push(entry[k]);
                }
            });
        });

        // make the plots
        const labels = {
            air_temp: "T<sub>a</sub> (°C)",
            dewpt: "T<sub>d</sub> (°C)",
            apparent_t: "T<sub>app</sub> (°C)",
            rel_hum: "R<sub>h</sub> (%)",
            wind_dir: "Wind Dir (°N)",
            wind_spd_kmh: "Wind Spd (km/h)",
            gust_kmh: "Wind Gust (km/h)",
            rain_trace: "Rain (mm)",
            press: "Pressure (hPa)",
            press_msl: "P<sub>MSL</sub> (hPa)",
            press_qnh: "P<sub>QNH</sub> (hPa)"
        };
        const { traces, layout } = plotTimeseriesSubplots(filteredData, groups, units, labels, loc);
        const customAttribution = `
            <p>This data is provided by the 
            <a href="http://www.bom.gov.au/" target="_blank">Australian Bureau of Meteorology, Commonwealth of Australia</a>
            under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons license (CC BY 4.0)</a>.</p>
            <p>For more information refer to their <a href="http://www.bom.gov.au/other/disclaimer.shtml" taret="_blank">Disclaimer</a> and <a href="http://www.bom.gov.au/other/copyright.shtml" target="_blanbk">Copyright</a> information.</p>`;
        showPlotOverlay(traces, layout, loc, customAttribution);
        
        return {data, groups, units};

    } catch (error) {
        console.error("Failed to load or parse JSON:", error);
        return null;
    }
}

function plotTimeseriesSubplots(data, groups, units, labels, loc) {
    if (!data || !data.time || data.time.length === 0) return;

    const timestamps = data.time;

    const layout = {
        title: {
            text: `${loc.DataType}: ${loc.Name} (Source: ${loc.Owner})`,
            font: { color: 'white' }
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'white' },
        grid: { rows: groups.length, columns: 1 },
        showlegend: true,
        margin: { l: 80, r: 20, t: 60, b: 60 },
    };

    const traces = [];

    groups.forEach((group, i) => {
        var yaxisKey = i === 0 ? 'y' : `y${i + 1}`;

        group.forEach(key => {
            if (!data[key]) return; // Skip keys with no data
        
            const xy = timestamps.map((t, j) => {
                const yVal = data[key][j];
                return (yVal !== undefined && !isNaN(yVal)) ? { x: t, y: yVal } : null;
            }).filter(d => d !== null);
        
            if (xy.length === 0) return;
        
            traces.push({
                x: xy.map(d => d.x),
                y: xy.map(d => d.y),
                yaxis: yaxisKey,
                xaxis: 'x',
                // name: key,
                name: labels[key] || key,

                type: 'scatter',
                mode: 'lines',
                line: { width: 2 }
            });
        });

        
        const xaxisKey = `xaxis${i > 0 ? i + 1 : ''}`;
        layout[xaxisKey] = configureAxis({
            title: i === groups.length - 1 ? 'Date Time (Local)' : '',
            showticklabels: i === groups.length - 1
        });

        // var yaxisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
        var yaxisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
        // const yTitle = labels[group[0]] || group[0];
        const yTitle = units[group[0]] || group[0];

        layout[yaxisKey] = configureAxis({ title: '('+yTitle+')' });


    });

    return { traces, layout };
}