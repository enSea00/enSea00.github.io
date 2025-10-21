async function getData_TidePredictions_BoM(loc) {
    try {
        const timeZone = tzlookup(loc.Latitude, loc.Longitude);
        const aac = loc.Notes;
        const Ndays = 7;
        const url = `http://www.bom.gov.au/australia/tides/print.php?aac=${aac}&type=tide&tz=${timeZone}&days=${Ndays}`;
        const proxy = 'https://corsproxy.io/?';
        const proxiedUrl = proxy + encodeURIComponent(url);
        const response = await fetch(proxiedUrl);
        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const tideDaysOuter = doc.querySelector('.tide-days-outer');
        if (!tideDaysOuter) return null;

        const tideDays = tideDaysOuter.querySelectorAll('.tide-day');
        const daysData = [];

        tideDays.forEach(day => {
            const date = day.querySelector('h3').textContent.trim();
            const tableRows = day.querySelectorAll('tr');
            const highLowData = { day: date, tides: [] };
            let currentTime = null, currentIsoTime = null, currentTideType = null;

            tableRows.forEach(row => {
                const timeEl = row.querySelector('.localtime');
                const heightEl = row.querySelector('.height');
                const isBlank = el => el && el.textContent.trim() === '\u00A0';

                if (timeEl && !isBlank(timeEl)) {
                    currentTime = timeEl.textContent.trim();
                    currentIsoTime = timeEl.getAttribute('data-time-local') || "-";
                    currentTideType = timeEl.classList.contains('low-tide') ? 'Low' : 'High';
                } else if (heightEl && !isBlank(heightEl) && currentTime && currentIsoTime) {
                    let heightValue = heightEl.textContent.trim();
                    highLowData.tides.push({
                        tideType: currentTideType || "-",
                        time: currentTime,
                        isoTime: currentIsoTime,
                        height: heightValue
                    });
                    currentTime = null;
                    currentIsoTime = null;
                    currentTideType = null;
                }
            });

            while (highLowData.tides.length < 4) {
                highLowData.tides.push({ tideType: "-", time: "-", isoTime: "-", height: "-" });
            }

            daysData.push(highLowData);
        });

        // Parse BOM-style date labels to YYYY-MM-DD
        function parseBoMDateLabel(dayStr) {
            const parts = dayStr.trim().split(' ');
            const year = new Date().getFullYear(); // Assume current year
            const monthMap = {
                Jan: '01', Feb: '02', Mar: '03', Apr: '04',
                May: '05', Jun: '06', Jul: '07', Aug: '08',
                Sep: '09', Oct: '10', Nov: '11', Dec: '12'
            };
            const day = parts[1].padStart(2, '0');
            const month = monthMap[parts[2]];
            return `${year}-${month}-${day}`;
        }

        const dateStrings = daysData.map(d => parseBoMDateLabel(d.day));
        const allShapes = await getDayNightShapes(loc.Latitude, loc.Longitude, dateStrings, timeZone);
        const now = DateTime.now().setZone(timeZone).toISO();
        allShapes.push({
            type: 'line',
            x0: now,
            x1: now,
            y0: 0,
            y1: 1,
            xref: 'x',
            yref: 'paper',
            line: {
                color: 'red',
                width: 2,
                dash: 'dot'
            }
        });

        // Annotations
        const allAnnotations = [];
        for (const day of daysData) {
            for (const tide of day.tides) {
                if (tide.isoTime === '-') continue;
                const height = parseFloat(tide.height);
                allAnnotations.push({
                    x: tide.isoTime,
                    y: height,
                    xref: 'x',
                    yref: 'y',
                    text: `${tide.time}<br>${tide.height}`,
                    showarrow: false,
                    yanchor: tide.tideType === 'High' ? 'bottom' : 'top',
                    align: 'center'
                });
            }
        }

        const { allTimes, allHeights } = stitchTideCurves(daysData);
        const tracePrediction = {
            x: allTimes,
            y: allHeights,
            mode: 'lines',
            name: 'Prediction',
            line: { color: '#1f77b4' },
            xaxis: 'x',
            yaxis: 'y1'
        };

        const layout = {
            title: {
                text: `${loc.DataType}: ${loc.Name} (Source: ${loc.Owner})`,
                font: { color: 'white' }
            },
            plot_bgcolor: 'rgba(0,0,0,0)',
            paper_bgcolor: 'rgba(0,0,0,0)',
            font: { color: 'white' },
            xaxis: configureAxis({ title: 'Date Time (Local)' }),
            yaxis: configureAxis({ title: 'Prediction (m)' }),
            showlegend: true,
            margin: { l: 80, r: 20, t: 40, b: 40 },
            annotations: allAnnotations,
            shapes: allShapes
        };

        const data = [tracePrediction];
        const customAttribution = `
        <p>This tide prediction is based on the <a href="http://www.bom.gov.au/australia/tides/" target="_blank">Australian Bureau of Meteorology tide tables</a> 
        with the tide curves being interpolated using the method provided in the <a href="https://services.hydro.gov.au/antt2025/?page=Calculating-Times-and-Heights-of-High-and-Low-Waters" target="_blank">Australian National Tide Tables</a>.</p>`;
        
        showPlotOverlay(data, layout, loc, customAttribution);

    } catch (err) {
        console.error("❌ Error:", err);
    }
}

// 
function stitchTideCurves(daysData) {
    const allTimes = [];
    const allHeights = [];

    const isoToDecimalHours = (isoString) => {
        return new Date(isoString).getTime() / (1000 * 60 * 60); // ms → decimal hours
    };

    const decimalHoursToISOString = (decimalHours) => {
        const ms = decimalHours * 60 * 60 * 1000; // decimal hours → ms
        const localDate = new Date(ms);

        const pad = (n) => n.toString().padStart(2, '0');

        // Format back to local ISO string without timezone offset
        return `${localDate.getFullYear()}-${pad(localDate.getMonth() + 1)}-${pad(localDate.getDate())}T${pad(localDate.getHours())}:${pad(localDate.getMinutes())}:${pad(localDate.getSeconds())}`;
    };

    const tideCurve = (t1, t2, h1, h2, steps = 12) => {
        const curveTimes = [];
        const curveHeights = [];
        const delta = (t2 - t1) / steps;

        for (let i = 0; i <= steps; i++) {
            const t = i * delta;
            const A = Math.PI * ((t) / (t2 - t1) + 1);
            const h = h1 + (h2 - h1) * (Math.cos(A) + 1) / 2;
            const timeString = decimalHoursToISOString(t + t1);
            curveTimes.push(timeString);
            curveHeights.push(h.toFixed(2));
        }
        return { curveTimes, curveHeights };
    };

    const allTides = daysData.flatMap(day => day.tides);
    for (let i = 0; i < allTides.length - 1; i++) {
        const tide1 = allTides[i];
        const tide2 = allTides[i + 1];
        const t1 = isoToDecimalHours(tide1.isoTime);
        const t2 = isoToDecimalHours(tide2.isoTime);

        const h1 = parseFloat(tide1.height);
        const h2 = parseFloat(tide2.height);

        if (isNaN(t1) || isNaN(t2) || isNaN(h1) || isNaN(h2) || t1 === t2) continue;

        const { curveTimes, curveHeights } = tideCurve(t1, t2, h1, h2);

        allTimes.push(...curveTimes);
        allHeights.push(...curveHeights);
    }

    return { allTimes, allHeights };
}

// 
async function getDayNightShapes(lat, lon, dateStrings, timeZone) {
    const allShapes = [];

    for (let i = 0; i < dateStrings.length; i++) {
        const date = dateStrings[i];
        const currentSun = await fetchSunriseSunset(lat, lon, date, timeZone);
        if (!currentSun) continue;

        const sunrise = new Date(currentSun.sunrise);
        const sunset = new Date(currentSun.sunset);
        
        // 🌞 Daytime
        allShapes.push({
            type: 'rect',
            x0: sunrise,
            x1: sunset,
            y0: 0,
            y1: 1,
            fillcolor: 'rgba(255, 255, 100, 0.25)',
            line: { width: 0 },
            xref: 'x',
            yref: 'paper',
            opacity: 0.4
        });

        // 🌒 Nighttime after sunset (if next sunrise is available)
        if (i + 1 < dateStrings.length) {
            const nextSun = await fetchSunriseSunset(lat, lon, dateStrings[i + 1], timeZone);
            if (!nextSun) continue;

            const nextSunrise = new Date(nextSun.sunrise);
            allShapes.push({
                type: 'rect',
                x0: sunset,
                x1: nextSunrise,
                y0: 0,
                y1: 1,
                fillcolor: 'rgba(0, 0, 0, 0.3)',
                line: { width: 0 },
                xref: 'x',
                yref: 'paper',
                opacity: 0.4
            });
        } else {
            // If this is the last day, end night at 23:59:59 local
            // const nightEnd = DateTime.fromISO(sunset.toISOString(), { zone: timeZone }).endOf('day');
            // allShapes.push({
            //     type: 'rect',
            //     x0: sunset,
            //     x1: nightEnd,
            //     y0: 0,
            //     y1: 1,
            //     fillcolor: 'rgba(0, 0, 0, 0.3)',
            //     line: { width: 0 },
            //     xref: 'x',
            //     yref: 'paper',
            //     opacity: 0.4
            // });
        }
    }

    return allShapes;
}

const { DateTime } = luxon;

async function fetchSunriseSunset(lat, lon, date, timeZone) {
    const apiUrl = `https://api.sunrise-sunset.org/json?lat=${lat}&lng=${lon}&date=${date}&formatted=0`;
    const response = await fetch(apiUrl);
    const data = await response.json();

    if (data.status !== 'OK') return null;

    const sunrise = DateTime.fromISO(data.results.sunrise, { zone: 'utc' }).setZone(timeZone);
    const sunset = DateTime.fromISO(data.results.sunset, { zone: 'utc' }).setZone(timeZone);
    return {
        sunrise: sunrise.toISO(), // Keep ISO for consistency with x-axis
        sunset: sunset.toISO()
    };
}


