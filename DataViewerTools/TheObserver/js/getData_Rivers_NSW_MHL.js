async function getData_Rivers_NSW_MHL(loc) {
    const datatype = loc.DataType;
    try {

        const notes = loc.Notes; // e.g., "IDs 98791042, 1224345 | Params Level 1, Level 2"
        const parts = notes.split('|');
        const ids = parts[0].replace("IDs", "").trim().split(',').map(id => id.trim());
        const params = parts[1].replace("Params", "").trim().split(',').map(p => p.trim());

        const data_url = `https://api.manly.hydraulics.works/api.php?format=json&page=rawdatatable&id=${ids.join('%2C')}&interval=&username=publicwww&token=Ujc3...`;

        async function loadAndParseTimeseries(url) {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch timeseries data");
            const json = await res.json();
            const timestamps = [];
            const WaterLevel = [];

            for (const [datetimeStr, values] of Object.entries(json.readings)) {
                const date = new Date(datetimeStr.replace(" ", "T"));
                timestamps.push(date);
                const observed = values[ids];
                WaterLevel.push(observed);
            }
            return { timestamps, WaterLevel};
        }

        const parsed = await loadAndParseTimeseries(data_url);
        if (!parsed) return;

        // Construct Plotly traces
        const traceWaterLevel = {
            x: parsed.timestamps,
            y: parsed.WaterLevel,
            mode: 'lines',
            name: 'Observed',
            line: { color: '#ff7f0e' },
            xaxis: 'x',
            yaxis: 'y1'
        };
        const layout = {
            title: {
                text: `${datatype}: ${loc.Name} (Source: ${loc.Owner})`,
                font: { color: 'white' }
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'white' },
            grid: { rows: 1, columns: 1 },
            xaxis: configureAxis({ title: 'Date Time (Local)' }),
            yaxis: configureAxis({ title: 'Level (m)' }),
            showlegend: true,
            margin: { l: 80, r: 20, t: 40, b: 40 },
        };

        const data = [traceWaterLevel];

        const customAttribution = `
        <p>This river data is provided by the <a href="https://mhl.nsw.gov.au/Data-Level" target="_blank">Manly Hydraulics Laboratory in the Biodiversity and Conservation Division, NSW Department of Planning and Environment</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" taret="_blank">Creative Common license (CC BY 4.0)</a>.</p>`;
        showPlotOverlay(data, layout, loc, customAttribution);

    } catch (err) {
        console.error("❌ Error:", err);
    }
}
