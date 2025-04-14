function parseDartData(text) {
    const lines = text.split('\n');
    const data = [];

    for (const line of lines) {
        if (!line.trim() || line.startsWith('#')) continue;

        const parts = line.trim().split(/\s+/);
        if (parts.length < 8) continue;

        const [year, month, day, hour, minute, second, , HEIGHT] = parts;
        const timestamp = new Date(Date.UTC(
            parseInt(year),
            parseInt(month) - 1,
            parseInt(day),
            parseInt(hour),
            parseInt(minute),
            parseInt(second)
        ));

        data.push({
            timestamp,
            height: parseFloat(HEIGHT),
        });
    }
    const units = { HEIGHT: 'm' };
    return { data, units };
}

function parseTXTData(text) {
    const lines = text.split('\n');
    const data = [];
    let units = {};
    let headers = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        if (line.startsWith('#YY')) {
            headers = line.replace('#', '').trim().split(/\s+/);
            continue;
        }

        if (line.startsWith('#yr')) {
            const unitLine = line.replace('#', '').trim().split(/\s+/);
            const paramHeaders = headers.slice(5);
            const paramUnits = unitLine.slice(5);

            paramHeaders.forEach((header, i) => {
                if (paramUnits[i] !== 'MM' && paramUnits[i] !== undefined) {
                    units[header] = paramUnits[i];
                }
            });
            continue;
        }

        if (line.startsWith('#')) continue;

        const parts = line.trim().split(/\s+/);
        if (parts.length === 19) {
            const [
                year, month, day, hour, minute,
                WDIR, WSPD, GST, WVHT, DPD, APD,
                MWD, PRES, ATMP, WTMP, DEWP, VIS, PTDY, TIDE
            ] = parts;

            const parseValue = (value) => (value === 'MM' ? NaN : parseFloat(value));
            const timestamp = new Date(Date.UTC(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                parseInt(hour),
                parseInt(minute)
            ));

            data.push({
                timestamp,
                WDIR: parseValue(WDIR),
                WSPD: parseValue(WSPD),
                GST: parseValue(GST),
                WVHT: parseValue(WVHT),
                DPD: parseValue(DPD),
                APD: parseValue(APD),
                MWD: parseValue(MWD),
                PRES: parseValue(PRES),
                ATMP: parseValue(ATMP),
                WTMP: parseValue(WTMP),
                DEWP: parseValue(DEWP),
                VIS: parseValue(VIS),
                PTDY: parseValue(PTDY),
                TIDE: parseValue(TIDE)
            });
        }
    }

    // Remove all-NaN fields and their units
    if (data.length > 0) {
        const keys = Object.keys(data[0]).filter(k => k !== 'timestamp');
        for (const key of keys) {
            const allNaN = data.every(row => isNaN(row[key]));
            if (allNaN) {
                data.forEach(row => delete row[key]);
                if (units[key]) delete units[key];
            }
        }
    }

    return { data, units };
}

async function getData_OceanBuoys_NDBC(loc) {
    console.log(loc.URL)
    const station_id = loc.URL.split('=').pop();
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const url1 = `${proxyUrl}${encodeURIComponent(`https://www.ndbc.noaa.gov/data/realtime2/${station_id}.dart`)}`;
    const url2 = `${proxyUrl}${encodeURIComponent(`https://www.ndbc.noaa.gov/data/realtime2/${station_id}.txt`)}`;

    let response, file_type;

    try {
        const res1 = await fetch(url1);
        const text1 = await res1.text();
        if (res1.status === 404 || /<title>\s*404/i.test(text1) || /Not Found/i.test(text1)) throw new Error();
        response = new Response(text1);
        file_type = 'dart';
    } catch {
        try {
            const res2 = await fetch(url2);
            if (!res2.ok) throw new Error();
            response = res2;
            file_type = 'txt';
        } catch {
            console.error('Neither URL is accessible.');
            return;
        }
    }

    const text = await response.text();
    let timeseries, units;

    if (file_type === 'dart') {
        ({ data: timeseries, units } = parseDartData(text));
    } else {
        ({ data: timeseries, units } = parseTXTData(text));
    }

    // Truncate to N most recent days
    const N = 7; // Change this as needed
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - N * 24 * 60 * 60 * 1000);
    timeseries = timeseries.filter(d => d.timestamp >= cutoffDate);

    // make the plots
    const { traces, layout } = plotTimeseriesSubplots(timeseries, units, loc);
    const customAttribution = `
        <p>This data is provided by the 
        <a href="https://www.ndbc.noaa.gov/" target="_blank">NOAA National Data Buoy Center</a>
        under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons license (CC BY 4.0)</a>.</p>`;
    
    showPlotOverlay(traces, layout, loc, customAttribution);
}

function plotTimeseriesSubplots(data, units, loc) {
    if (!data || data.length === 0) return;

    const timestamps = data.map(d => d.timestamp || d.TIME);
    const keys = Object.keys(data[0]).filter(k => k !== 'timestamp' && k !== 'TIME');

    const traces = keys.map((key, i) => ({
        x: timestamps,
        y: data.map(d => d[key]),
        xaxis: `x${i + 1}`,
        yaxis: `y${i + 1}`,
        type: 'scatter',
        mode: 'lines',
        name: key,
        line: { shape: 'hv', width: 2 }
    }));

    const layout = {
        title: {
            text: `${loc.DataType}: ${loc.Name} (Source: ${loc.Owner})`,
            font: { color: 'white' }
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'white' },

        grid: { rows: keys.length, columns: 1, pattern: 'independent' },
        showlegend: true,
        margin: { l: 80, r: 20, t: 40, b: 40 },
    };

    keys.forEach((key, i) => {
        const xKey = i === 0 ? 'xaxis' : `xaxis${i + 1}`;
        const yKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
        // xaxis: configureAxis({ }),
        // yaxis: configureAxis({ }),

        layout[xKey] = configureAxis({ title: 'Date Time (UTC)' });
        let unitLabel = units[key] || '';
        if (unitLabel.toLowerCase().includes('deg')) {
            unitLabel = unitLabel.replace(/deg/gi, '°');
        }
        layout[yKey] = configureAxis({ title: `${key} (${unitLabel})`});

        // layout[yKey] = { title: { text: `${key} (${units[key] || ''})` } };
    });

    return { traces, layout };
}
