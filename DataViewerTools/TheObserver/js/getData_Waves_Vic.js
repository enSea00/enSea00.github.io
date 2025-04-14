async function getData_Waves_Vic(loc) {

    const id = loc.Notes.split(',')[0].split('=')[1].trim();
    var data_url = `https://vicwaves.com.au/wp-json/waves/v1/buoys/${id}?type=waves&simplified=1`
    
    async function fetchAndParseTimeseries(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
            const json = await response.json();
    
            const data = json.data || [];
    
            const parsed = {
                timestamps: [],
                Hsig: [],
                Tp: [],
                Tm: [],
                Dp: [],
                Dm: [],
                SST: [],
                WndSpd: [],
                WndDir: [],
                // Add more if needed
            };
    
            data.forEach(entry => {
                const timestamp = new Date(parseInt(entry.time) * 1000); // convert Unix to Date
                parsed.timestamps.push(timestamp);
                parsed.Hsig.push(parseFloat(entry.hsig));
                parsed.Tp.push(parseFloat(entry.tp));
                parsed.Tm.push(parseFloat(entry.tm));
                parsed.Dp.push(parseFloat(entry.tpdeg));
                parsed.Dm.push(parseFloat(entry.tmdeg));
                parsed.SST.push(parseFloat(entry.sst));
                parsed.WndSpd.push(parseFloat(entry.windspeed));
                parsed.WndDir.push(parseFloat(entry.winddirect));
            });
    
            return parsed;
        } catch (err) {
            console.error("Error parsing timeseries:", err);
            return null;
        }
    }
    
    const parsed = await fetchAndParseTimeseries(data_url);
    if (!parsed) return;

    // Create traces for Hsig and Hmax
    var traceHsig = {
        x: parsed.timestamps,
        y: parsed.Hsig,
        mode: 'lines',
        name: 'H<sub>sig</sub>',
        line: { color: '#ff7f0e' }, // Example color for Hsig
        xaxis: 'x', // Assign to the first x-axis
        yaxis: 'y1' // Assign to the first y-axis
    };

    // Create traces for Tz and Tp
    var traceTp = {
        x: parsed.timestamps,
        y: parsed.Tp,
        mode: 'lines',
        name: 'T<sub>p</sub>',
        line: { color: '#9467bd' }, // Example color for Tp
        yaxis: 'y2', // Assign to the second y-axis
        xaxis: 'x' // Assign to the second x-axis
    };

    var traceTm = {
        x: parsed.timestamps,
        y: parsed.Tm,
        mode: 'lines',
        name: 'T<sub>m</sub>',
        line: { color: '#2ca02c' }, // Example color for Tz
        yaxis: 'y2', // Assign to the second y-axis
        xaxis: 'x' // Assign to the second x-axis
    };
    
    var traceDp = {
        x: parsed.timestamps,
        y: parsed.Dp,
        mode: 'lines',
        name: 'D<sub>p</sub>',
        line: { color: '#9467bd' }, // Example color for Direction
        yaxis: 'y3', // Assign to the third y-axis
        xaxis: 'x' // Assign to the third x-axis
    };

    var traceDm = {
        x: parsed.timestamps,
        y: parsed.Dm,
        mode: 'lines',
        name: 'D<sub>m</sub>',
        line: { color: '#2ca02c' }, // Example color for Direction
        yaxis: 'y3', // Assign to the third y-axis
        xaxis: 'x' // Assign to the third x-axis
    };

    var traceSST = {
        x: parsed.timestamps,
        y: parsed.SST,
        mode: 'lines',
        name: 'SST',
        line: { color: 'coral' }, // Example color for Direction
        yaxis: 'y4', // Assign to the third y-axis
        xaxis: 'x' // Assign to the third x-axis
    };

    var traceWndSpd = {
        x: parsed.timestamps,
        y: parsed.WndSpd,
        mode: 'lines',
        name: 'Wind Speed',
        line: { color: '#17becd' }, // Example color for SST
        yaxis: 'y5', // Assign to the fourth y-axis
        xaxis: 'x' // Assign to the fourth x-axis
    };

    var traceWndDir = {
        x: parsed.timestamps,
        y: parsed.WndDir,
        mode: 'lines',
        name: 'Wind Dir',
        line: { color: 'lightgreen' }, // Example color for Current
        yaxis: 'y6', // Assign to the fifth y-axis
        xaxis: 'x' // Assign to the fifth x-axis
    };

    // Define layout with dark theme
    var layout = {
        // title: {text: datatype +': '+ name +' ('+latlng.lng+'°E, '+latlng.lat+'°N)', font: { color: 'white' }},
        title: {text: loc.DataType +': '+ loc.Name +' (Source: '+loc.Owner+')', font: { color: 'white' }},
        plot_bgcolor: 'rgba(0,0,0,0)', // Dark background for the entire plot
        paper_bgcolor: 'rgba(0,0,0,0)', // Dark background for the paper (around the plot)
        font: { color: 'white' },       // White font for the whole plot
        grid: { rows: 6, columns: 1}, // Arrange as 4-row subplot
        // Apply settings to x-axes
        xaxis: configureAxis({ title: '', showticklabels: false }),
        xaxis2: configureAxis({ title: '', showticklabels: false }),
        xaxis3: configureAxis({ title: '', showticklabels: false }),
        xaxis4: configureAxis({ title: '', showticklabels: true }),
        xaxis5: configureAxis({ title: 'Date Time (Local)' }),
        
        // Apply settings to all y-axes
        yaxis: configureAxis({ title: 'Height (m)'}),
        yaxis2: configureAxis({ title: 'Period (s)'}),
        yaxis3: configureAxis({ title: 'Dir (°N)'}),
        yaxis4: configureAxis({ title: 'SST (°C)'}),
        yaxis5: configureAxis({ title: 'Speed (m/s)'}),
        yaxis6: configureAxis({ title: 'Dir (°N)'}),
        showlegend: true,
        margin: { l: 80, r: 20, t: 40, b: 40 },
    };
    // create data array to send to plotly layout
    var data = [traceHsig, traceTp, traceTm, traceDp, traceDm, traceSST, traceWndSpd, traceWndDir];

    // Make the plot overlay
    const customAttribution = `
    <p>This wave buoy data is provided by the <a href="https://vicwaves.com.au/" target="_blank">Victorian Coastal Monitoring Program</a> with funding through the Department of Environment, Land, Water and Planning, University of Melbourne and Deakin University.</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" taret="_blank">Creative Common license (CC BY 4.0)</a>.</p>
    `;
    showPlotOverlay(data, layout, loc, customAttribution);

}