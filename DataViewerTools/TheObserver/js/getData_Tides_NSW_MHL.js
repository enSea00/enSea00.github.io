async function getData_Tides_NSW_MHL(loc) {
    const name = loc.Name;
    const datatype = loc.DataType;
    const id = loc.URL.split('-').pop();

    try {
        const notes = loc.Notes; // e.g., "IDs 98791042, 1224345 | Params Level 1, Level 2"
        const parts = notes.split('|');
        const ids = parts[0].replace("IDs", "").trim().split(',').map(id => id.trim());
        const params = parts[1].replace("Params", "").trim().split(',').map(p => p.trim());
        // Normalize param labels
        const normalizedLabels = params.map(label => {
            if (label === "Level 1") return "Observed";
            if (label === "Forecast Level") return "Predicted";
            return label; // Leave others like "Residual" untouched
        });

        // Create the labelToId mapping
        const labelToId = {};
        normalizedLabels.forEach((label, index) => {
            if (ids[index]) {
                labelToId[label] = ids[index];
            }
        });

        // Get the timeseries data
        const data_url = `https://api.manly.hydraulics.works/api.php?format=json&page=rawdatatable&id=${ids.join('%2C')}&interval=&username=publicwww&token=Ujc3...`;

        async function loadAndParseTimeseries(url) {
            const res = await fetch(url);
            if (!res.ok) throw new Error("Failed to fetch timeseries data");
            const json = await res.json();
            console.log(json)
            const timestamps = [];
            const WaterLevel = [];
            const Prediction = [];
            const Residual = [];

            for (const [datetimeStr, values] of Object.entries(json.readings)) {
                const date = new Date(datetimeStr.replace(" ", "T"));
                timestamps.push(date);

                const pred = values[labelToId["Predicted"]];
                const resid = values[labelToId["Residual"]];
                const observed = parseFloat((resid + pred).toFixed(3));

                Residual.push(resid);
                Prediction.push(pred);
                WaterLevel.push(observed);
            }

            return { timestamps, WaterLevel, Prediction, Residual };
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
        const tracePrediction = {
            x: parsed.timestamps,
            y: parsed.Prediction,
            mode: 'lines',
            name: 'Prediction',
            line: { color: '#1f77b4' },
            xaxis: 'x',
            yaxis: 'y1'
        };
        const traceResidual = {
            x: parsed.timestamps,
            y: parsed.Residual,
            mode: 'lines',
            name: 'Residual',
            line: { color: '#2ca02c' },
            xaxis: 'x',
            yaxis: 'y2'
        };

        const layout = {
            title: {
                text: `${datatype}: ${loc.Name} (Source: ${loc.Owner})`,
                font: { color: 'white' }
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'white' },
            grid: { rows: 2, columns: 1 },
            xaxis: configureAxis({ title: '' }),
            xaxis2: configureAxis({ title: 'Date Time (Local)' }),
            yaxis: configureAxis({ title: 'Level (m)' }),
            yaxis2: configureAxis({ title: 'Residual (m)' }),
            showlegend: true,
            margin: { l: 80, r: 20, t: 40, b: 40 },
        };

        const data = [traceWaterLevel, tracePrediction, traceResidual];

        const customAttribution = `
        <p>This tide gauge data is provided by the <a href="https://mhl.nsw.gov.au/Data-OceanTide" target="_blank">Manly Hydraulics Laboratory in the Biodiversity and Conservation Division, NSW Department of Planning and Environment</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" taret="_blank">Creative Common license (CC BY 4.0)</a>.</p>`;
        showPlotOverlay(data, layout, loc, customAttribution);

    } catch (err) {
        console.error("❌ Error:", err);
    }
}
