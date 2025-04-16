// DART BUOY DATA - COLUMN HEIGHT ONLY /////////////////////////////////////////////////////////////////////////////////////////////////////
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

    // Define key groups to be plotted together (grouped by related variables)
    const groups = [
        ['height'],
    ];
    
    return { data, units, groups };
}

// STANDARD METEOROLOGICAL DATA /////////////////////////////////////////////////////////////////////////////////////////////////////
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
                parseInt(year), parseInt(month) - 1, parseInt(day),
                parseInt(hour), parseInt(minute)
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
    const removedKeys = new Set();
    if (data.length > 0) {
        const keys = Object.keys(data[0]).filter(k => k !== 'timestamp');
        for (const key of keys) {
            const allNaN = data.every(row => isNaN(row[key]));
            if (allNaN) {
                removedKeys.add(key);
                data.forEach(row => delete row[key]);
                if (units[key]) delete units[key];
            }
        }
    }

    // Define key groups and remove any that are now empty
    let groups = [
        ['WVHT'],
        ['DPD', 'APD'],
        ['MWD','WDIR'],
        ['WSPD', 'GST'],
        ['WTMP', 'ATMP', 'DEWP'],
        ['PRES']
    ];

    // Remove keys that were deleted and remove empty groups
    groups = groups.map(group => group.filter(k => !removedKeys.has(k)))
                   .filter(group => group.length > 0);

    return { data, units, groups };
}

// DRIFT BUOY DATA /////////////////////////////////////////////////////////////////////////////////////////////////////
function parseDRIFTData(text) {
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
        // if (parts.length === 16) {
            const [
                year, month, day, hhmm, LAT, LON,
                WDIR, WSPD, GST, PRES, PTDY, ATMP, WTMP, DEWP, WVHT, DPD
            ] = parts;

            const parseValue = (value) => (value === 'MM' ? NaN : parseFloat(value));
            // split hhmm into hour and minute
            let hour = Math.floor(hhmm / 100);
            let minute = hhmm % 100;
            const timestamp = new Date(Date.UTC(
                parseInt(year), parseInt(month) - 1, parseInt(day),
                parseInt(hour), parseInt(minute)
            ));

            data.push({
                timestamp,
                LAT: parseValue(LAT),
                LON: parseValue(LON),
                WDIR: parseValue(WDIR),
                WSPD: parseValue(WSPD),
                GST: parseValue(GST),
                WVHT: parseValue(WVHT),
                DPD: parseValue(DPD),
                PRES: parseValue(PRES),
                ATMP: parseValue(ATMP),
                WTMP: parseValue(WTMP),
                DEWP: parseValue(DEWP),
                PTDY: parseValue(PTDY),
            });
        // }
    }

    // Remove all-NaN fields and their units
    const removedKeys = new Set();
    if (data.length > 0) {
        const keys = Object.keys(data[0]).filter(k => k !== 'timestamp');
        for (const key of keys) {
            const allNaN = data.every(row => isNaN(row[key]));
            if (allNaN) {
                removedKeys.add(key);
                data.forEach(row => delete row[key]);
                if (units[key]) delete units[key];
            }
        }
    }

    // Define key groups and remove any that are now empty
    let groups = [
        ['WVHT'],
        ['DPD'],
        ['WDIR'],
        ['WSPD', 'GST'],
        ['WTMP', 'ATMP', 'DEWP'],
        ['PRES']
    ];

    // Remove keys that were deleted and remove empty groups
    groups = groups.map(group => group.filter(k => !removedKeys.has(k)))
                   .filter(group => group.length > 0);

    return { data, units, groups };
}

// MAIN FUNCTION /////////////////////////////////////////////////////////////////////////////////////////////////////
async function getData_OceanBuoys_NDBC(loc) {
    console.log(loc.URL)
    const station_id = loc.URL.split('=').pop();
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const fileTypes = ['dart', 'txt', 'drift'];

    let response, file_type, text;

    for (const type of fileTypes) {
        const url = `${proxyUrl}${encodeURIComponent(`https://www.ndbc.noaa.gov/data/realtime2/${station_id}.${type}`)}`;
        try {
            const res = await fetch(url);
            const resText = await res.text();
            if (res.status === 404 || /<title>\s*404/i.test(resText) || /Not Found/i.test(resText)) throw new Error();
            response = new Response(resText);
            file_type = type;
            text = resText;
            break; // Exit loop on success
        } catch {
            continue; // Try next file type
        }
    }

    if (!response) {
        console.error('None of the URLs are accessible.');
        return;
    }

    let timeseries, units, groups;

    if (file_type === 'dart') {
        ({ data: timeseries, units, groups } = parseDartData(text));
    } else if (file_type === 'txt') {
        ({ data: timeseries, units, groups } = parseTXTData(text));
    } else if (file_type === 'drift') {
        ({ data: timeseries, units, groups } = parseDRIFTData(text));
    }

    // Truncate to N most recent days
    const N = 7; // Change this as needed
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - N * 24 * 60 * 60 * 1000);
    timeseries = timeseries.filter(d => d.timestamp >= cutoffDate);

    // make the plots
    const { traces, layout } = plotTimeseriesSubplots(timeseries, units, groups, loc);
    const customAttribution = `
        <p>This data is provided by the 
        <a href="https://www.ndbc.noaa.gov/" target="_blank">NOAA National Data Buoy Center</a>
        under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Commons license (CC BY 4.0)</a>.</p>`;
    
    showPlotOverlay(traces, layout, loc, customAttribution);
}

// PLOTTING /////////////////////////////////////////////////////////////////////////////////////////////////////

function plotTimeseriesSubplots(data, units, groups, loc) {
    if (!data || data.length === 0) return;

    const timestamps = data.map(d => d.timestamp || d.TIME);

    // initialise layout 
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


    // create subplot traces
    const traces = [];
    groups.forEach((group, i) => {

        var yaxisKey = i === 0 ? 'y' : `y${i + 1}`; // 

        group.forEach(key => {
            const xy = timestamps.map((t, i) => {
                const yVal = data[i][key];
                return (yVal !== undefined && !isNaN(yVal)) ? { x: t, y: yVal } : null;
            }).filter(d => d !== null);
        
            traces.push({
                x: xy.map(d => d.x),
                y: xy.map(d => d.y),
                yaxis: yaxisKey,
                xaxis: 'x',
                name: key,
                type: 'scatter',
                mode: 'lines',
                line: { width: 2 }
            });
        });

        // xaxis formatting
        if (i === groups.length - 1) {
            layout['xaxis'] = configureAxis({ title: 'Date Time (UTC)' });
        } else {
            layout['xaxis'] = configureAxis({ title: '', showticklabels: false });
        }
        
        // yaxis formatting
        var yaxisKey = i === 0 ? 'yaxis' : `yaxis${i + 1}`;
        const yTitle = (units[group[0]] ? ` (${units[group[0]].replace(/deg/gi, '°')})` : '')
        layout[yaxisKey] = configureAxis({ title: yTitle});

    })

    return { traces, layout };
}

// 