// Definitions by DataType - this is displayed via the "info" popup on the timeseries plt overlay
// format is definitionByType = {'DataType' : 'Definition text to display'} where DataType is as per the locations_all.js database
const definitionsByType = {
    'Weather Station' :`
        <h3>Definitions</h3>
            <ul>
                <li>T<sub>a</sub> - Ambient air temperature (°C)</li>
                <li>T<sub>d</sub> - Dew point temperature (°C)</li>
                <li>T<sub>app</sub> - Steadman apparent air temprature (°C) <a href="http://www.bom.gov.au/info/thermal_stress/" target="_blank">More information</a></li>
                <li>R<sub>h</sub> - Relative humidity (%)	</li>
                <li>Wind Dir - Wind direction relative to True North (°C), from which the wind is blowing</li>
                <li>Wind Spd - Wind speed (km/h) averaged over 10 minutes </li>
                <li>Wind Gust - Wind gust (km/h)	measured over 3 seconds </li>
                <li>Rain - Cumulative rainfall since 9 am (mm)</li>
                <li>Pressure - Station level atmospheric pressure (hPa)</li>
                <li>P<sub>MSL</sub> - Atmospheric pressure reduced to mean sea level (hPa)</li>
                <li>P<sub>MNH</sub> - QNH pressure. The correction from station level pressure to QNH pressure is based on the conditions specified by the International Standard Atmosphere. QNH pressure is used by pilots to set the altimeter of their aircraft. QNH pressure is closely related to Mean Sea Level Pressure (MSLP) at low elevations, and can vary significantly from MSLP at high elevations.</li>
            </ul>
            `,
    'Wave Buoy': `
        <h3>Definitions</h3>
            <ul>
                <li><a href="https://www.coastalwiki.org/wiki/Statistical_description_of_wave_parameters#Significant_wave_height" target="_blank">H<sub>sig</sub> - Significant wave height, the average of the highest third of the waves in a record</a></li>
                <li>H<sub>max</sub> - The maximum wave height in the record</li>
                <li><a href="https://www.coastalwiki.org/wiki/Statistical_description_of_wave_parameters#Peak_wave_period" target="_blank">T<sub>p</sub> - The peak wave period, the wave period at the peak of the wave energy spectrum</a></li>
                <li>T<sub>z</sub> or T<sub>m</sub> - Mean zero-crossing wave period, average wave period based on <a href="https://en.wikipedia.org/wiki/Zero_crossing" target="_blank">zero crossing</a></li>
                <li>D<sub>p</sub> - Peak wave direction, from the wave energy spectrum</li>
                <li><a href="https://www.coastalwiki.org/wiki/Statistical_description_of_wave_parameters#Mean_wave_direction" target="_blank">D<sub>m</sub> - Mean wave direction, average over the record</a></li>
                <li>SST - Sea surface temperature</li>
                <li>Current - Sea surface current speed</li>
            </ul>
    `,
    'Tide Gauge': `
        <h3>Definitions</h3>
            <ul>
                <li><b>Observed</b> - the observed water level</li>
                <li><b>Prediction</b> - the predicted tide level</li>
                <li><b>Residual</b> - the difference between the Observed and Predicted water levels otherwise known as the Tidal Anomaly</li>
            </ul>
    `,
    'Rain Gauge':`
        <h3>Definitions</h3>
            <ul>
                <li><b>Rainfall</b> - the incremental rainfall amount</li>
            </ul>
    `,
    'River Gauge':`
        <h3>Definitions</h3>
            <ul>
                <li><b>Observed</b> - the observed water level relative to a local datum</li>
            </ul>
    `,
    'Ocean Buoy (Active)' :`
        <h3>Definitions</h3>
            <ul>
                <li>HEIGHT - Water column height (depth).</li>
                <li>WDIR - Wind direction (the direction the wind is coming from, &deg;N)</li>
                <li>WSPD - Wind speed (m/s) averaged over an eight-minute period. Reported Hourly. </li>
                <li>GST - Peak 5 or 8 second gust speed (m/s) measured during the eight-minute</li>
                <li>WVHT - Significant wave height (m), the average of the highest one-third of all of the wave heights during the 20-minute sampling period.</li>
                <li>DPD - Dominant wave period (s) is the period with the maximum wave energy. </li>
                <li>APD - Average wave period (s) of all waves during the 20-minute period.</li>
                <li>MWD - The direction from which the waves at the dominant period (DPD) are coming (&deg;N). </li>
                <li>PRES - Sea level pressure (hPa).</li>
                <li>ATMP - Air temperature (&deg;C)</li>
                <li>WTMP - Sea surface temperature (&deg;C)</li>
                <li>DEWP - Dewpoint temperature (&deg;C).</li>
                <li>VIS - Station visibility (nautical miles).</li>
                <li>PTDY - Pressure Tendency is the direction and amount of pressure change (hPa) for a three hour period ending at the time of observation.</li>
                <li>TIDE - The water level (ft) above or below <a href="https://tidesandcurrents.noaa.gov/datum_options.html#MLLW" target="_blank">Mean Lower Low Water (MLLW)</a>.</li>
            </ul>
        <p><a href="https://www.ndbc.noaa.gov/faq/measdes.shtml#stdmet" target="_blank">Click here for Further Information</a></p>
    `,

};

// Disclaimer - displayed on the info popup on the timeseries plotter 
const disclaimerHTML = `<h3>Disclaimer</h3>
                        <p>The data shown has not been quality controlled. For quality controlled data you should contact the attributed provider directly.`

// Create the timeseries plot info box content (attribute, definitions, discplaimer)
function updateInfoBox(loc, attributionHTML = '') {
    const infoBox = document.getElementById('infoBox');
    if (!infoBox) return;

    const definitionsHTML = definitionsByType[loc.DataType] || '';
    infoBox.innerHTML = `
        <h3>Data Source Attribution</h3>
        ${attributionHTML || '<p>No attribution provided.</p>'}
        ${definitionsHTML}
        ${disclaimerHTML}
    `;
}

// Local time at clicked location ////////////////////////////////////////////////////////
const { DateTime } = luxon;

function getLocalTimeISO(lat, lon) {
    const timezone = tzlookup(lat, lon);  // e.g., "Australia/Sydney"
    const now = DateTime.now().setZone(timezone);

    // Return ISO-like string without timezone info (to match Plotly x-axis)
    return now
}

// Day Shading ////////////////////////////////////////////////////////////////////////
function getDayShadingShapesLocal(latitude, longitude, timestamps) {
    if (!timestamps || timestamps.length === 0) return [];

    const SunCalc = window.SunCalc || (typeof require !== 'undefined' ? require('suncalc') : null);
    if (!SunCalc) {
        console.warn("SunCalc is required for day/night shading.");
        return [];
    }

    const { DateTime } = luxon;
    const timezone = tzlookup(latitude, longitude);

    const shapes = [];
    const seenDates = new Set();

    timestamps.forEach(ts => {
        const date = new Date(ts);
        const dayKey = date.toISOString().split('T')[0];
        if (seenDates.has(dayKey)) return;
        seenDates.add(dayKey);

        const times = SunCalc.getTimes(date, latitude, longitude);
        const { dawn, sunrise, sunset, dusk } = times;

        if (dawn && sunrise && sunset && dusk && sunset > sunrise) {
            const fmt = dt => DateTime.fromJSDate(dt).setZone(timezone).toFormat("yyyy-MM-dd'T'HH:mm:ss");

            // Civil twilight before sunrise
            if (dawn < sunrise) {
                shapes.push({
                    type: "rect",
                    xref: "x",
                    yref: "paper",
                    x0: fmt(dawn),
                    x1: fmt(sunrise),
                    y0: 0,
                    y1: 1,
                    fillcolor: "rgba(255, 255, 153, 0.1)", // twilight (light yellow)
                    line: { width: 0 },
                    layer: "below"
                });
            }

            // Full daylight
            shapes.push({
                type: "rect",
                xref: "x",
                yref: "paper",
                x0: fmt(sunrise),
                x1: fmt(sunset),
                y0: 0,
                y1: 1,
                fillcolor: "rgba(255, 255, 153, 0.2)", // stronger yellow
                line: { width: 0 },
                layer: "below"
            });

            // Civil twilight after sunset
            if (sunset < dusk) {
                shapes.push({
                    type: "rect",
                    xref: "x",
                    yref: "paper",
                    x0: fmt(sunset),
                    x1: fmt(dusk),
                    y0: 0,
                    y1: 1,
                    fillcolor: "rgba(164, 201, 250, 0.1)", // twilight
                    line: { width: 0 },
                    layer: "below"
                });
            }
        }
    });

    return shapes;
}


// TIMSERIES PLOT FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////
// called by the getData_ functions
function createTimeseriesSubplots(observations, variableNameMap, subplotGroups, loc) {
    
    // check if there is any data to plot
    if (!observations || observations.length === 0) {
        console.warn("No observations to plot.");
        return;
      }

    // apply name change mapping and clear any empty variables 
    const cleanedObservations = observations.map(obs => {
        const cleaned = {};
      
        for (const [key, value] of Object.entries(obs)) {
          // Handle DateTime based on variableNameMap
          if (key === "timestamp") {
            cleaned.timestamp = obs.timestamp; // Add timestamp as a new field
          } else if (key in variableNameMap) {
            // Rename other variables based on variableNameMap
            cleaned[variableNameMap[key]] = value;
          }
        }
      
        return cleaned;
    });

  
    // remove variables from subplotGroups that have no data
    const candidateKeys = new Set();
    cleanedObservations.forEach(obs => {
        for (const key of Object.keys(obs)) {
            if (key !== 'timestamp') {
                candidateKeys.add(key);
            }
        }
    });

    const allKeys = new Set();
    candidateKeys.forEach(key => {
        const hasValidValue = cleanedObservations.some(obs => {
            const val = obs[key];
            return !(val === '-' || Number.isNaN(val) || val === undefined || val === null);
        });
        if (hasValidValue) {
            allKeys.add(key);
        }
    });

    // Filter subplotGroups to retain only those variables that are actually present
    subplotGroups = subplotGroups
    .map(group => group.filter(varName => allKeys.has(varName)))
    .filter(group => group.length > 0); // Remove empty groups


    const traces = [];
    const timestamps = cleanedObservations.map(obs => obs.timestamp);

    // Dynamically use D3 color scheme - https://d3js.org/d3-scale-chromatic/categorical#categorical-schemes
    // d3.category10, d3.Dark2, d3.Tableau10, d3.Observable10, 
    // const d3Colors = d3.schemeTableau10;  // You can change to d3.schemeDark2, etc.
    const d3Colors = ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#bcbd22","#17becf","#7f7f7f"] // category10 reordered to move th egrey
    const uniqueVariables = Array.from(new Set(subplotGroups.flat()));
    const variableColors = {};
    uniqueVariables.forEach((v, i) => {
        variableColors[v] = d3Colors[i % d3Colors.length]; // Cycle if needed
    });
      
    // initialise layout
    const layout = {
        title: {
            text: `${loc.DataType}: ${loc.Name} (Source: ${loc.Owner})`,
            font: { color: 'white' }
        },
        plot_bgcolor: 'rgba(0,0,0,0)',
        paper_bgcolor: 'rgba(0,0,0,0)',
        font: { color: 'white' },
        grid: { rows: subplotGroups.length, columns: 1 },
        showlegend: true,
        margin: { l: 80, r: 20, t: 60, b: 60 },
        colorway: d3Colors,

        // Link hovers across subplots
        hovermode: 'x unified',  // <- key part
        hoversubplots:"axis",
        hoverlabel: {
            bgcolor: '#333333',        // Background of hover box
            bordercolor: '#AAAAAA',    // Border color
            font: {
                color: 'white',        // Font color inside the box
                family: 'Arial',       // Font family
                size: 12               // Font size
            },
        },
    };  

    subplotGroups.forEach((group, index) => {
        group.forEach(variable => {
            const yData = cleanedObservations.map(obs => obs[variable] ?? null);
            if (!yData.some(val => val !== null)) return; // Skip empty

            // const latestValidIndex = [...yData].reverse().findIndex(val => val !== null && val !== undefined && !Number.isNaN(val));
            const latestValue = yData.length > 0 ? yData[yData.length-1] : 'n/a';
            const includeMarkers = timestamps.length < 10; // arbitrarily set minimum timeseries length below which markers are included

            traces.push({
                x: timestamps,
                y: yData,
                name: `${variable} = <i>${latestValue}</i>`,  // 💡 append latest value to name
                xaxis: `x`,
                yaxis: `y${index + 1}`,
                mode: includeMarkers ? "lines+markers" : "lines",
                line: includeMarkers ?  { color: variableColors[variable], dash: 'dash'  } : { color: variableColors[variable] },
                marker: {
                    color: variableColors[variable],
                    size: 14,
                    symbol: 'circle',
                    opacity: 0.8,
                },
                connectgaps: false,
                type: "scatter",
                hovertemplate: yData.every(v => v === null)
                    ? '' 
                    : `${variable}: %{y}<extra></extra>`,
            });

        });

        
        const axisId = index === 0 ? "" : index + 1;
        layout[`xaxis${axisId}`] = configureAxis({
            title: index === subplotGroups.length - 1 ? 'Date Time (Local)' : '',
            showticklabels: index === subplotGroups.length - 1
            });

        const yTitle = group[0].split(' ').pop();
        layout[`yaxis${axisId}`] = configureAxis({ title: yTitle });

        const latestTime = new Date(Math.max(...timestamps.map(t => new Date(t).getTime())));
        // const timeString = latestTime.toLocaleString(); // or use your preferred format
        const timeString = new Intl.DateTimeFormat('en-GB', {
                                day: '2-digit', month: '2-digit', year: 'numeric',
                                hour: '2-digit', minute: '2-digit',
                                hour12: false
                                }).format(latestTime).replace(',', '');

        layout.legend = {
        title: {
            text: `<b>Legend</b><br><br>[<i>Latest Data as at <br>${timeString}</i>] <br>`
        },
        font: { color: 'white' , size:18},
        bgcolor: 'rgba(0,0,0,0)',
        };



    });
  
    // Add vertical dashed line for current time across all subplots
    const nowLocalISO = getLocalTimeISO(loc.Latitude, loc.Longitude).toFormat("yyyy-MM-dd'T'HH:mm:ss");
    const nowLocalISOstr = getLocalTimeISO(loc.Latitude, loc.Longitude).toFormat("HH:mm, dd/MM/yyyy");

    layout.shapes = layout.shapes || [];
    
    layout.shapes.push({
        type: 'line',
        xref: 'x',       // Use shared x-axis
        yref: 'paper',   // Vertical line across entire figure height
        x0: nowLocalISO,
        x1: nowLocalISO,
        y0: 0,
        y1: 1,
        line: {
            color: 'rgba(255, 255, 0,0.5)',
            width: 3,
            dash: 'dot'
        }
    });
    layout.annotations = layout.annotations || [];
    layout.annotations.push({
        x: nowLocalISO,
        y: 1.05, // slightly above the top
        xref: 'x',
        yref: 'paper',
        text: `Current Time (Local)<br> (${nowLocalISOstr})`,
        showarrow: false,
        font: {
            color: 'rgba(255, 255, 0,0.5)',
            size: 12,
            family: 'Arial'
        },
        align: 'center',
    });

    // Day Shading
    const dayShapes = getDayShadingShapesLocal(loc.Latitude, loc.Longitude, timestamps);
    layout.shapes = [...(layout.shapes || []), ...dayShapes];

    return { traces, layout };

};

//  axis configuration
function configureAxis(axis) {
    return {
        title: {text: axis.title},   // Axis title
        zeroline: axis.zeroline || false,     // Show zero line
        showgrid: true,              // Show grid lines
        gridcolor: 'rgba(240, 240, 240, 0.2)', // Grid color: off-white, partially transparent
        gridwidth: 1,                // Grid line width
        linecolor: 'rgba(240, 240, 240, 0.4)', // Axis line color
        linewidth: 2,                // Axis line width
        tickcolor: 'rgba(240, 240, 240, 0.4)', // Tick color
        ticks: 'outside',            // Tick marks outside the axis
        tickfont: { color: '#f0f0f0' }, // Tick label font color
        tickformat: axis.tickformat || '',  // Optional tick format
        showticklabels: axis.showticklabels || true,
        dash: 'dash',                 // Dotted grid lines
        showline: true,              // Show axis line
        mirror: false,                // Mirror axis lines on all sides
        title_standoff: axis.title_standoff || 25, // Ensure the right axis label has more space from the plot
    };
}

// Get and display latest data values in a box
// function updateLatestValuesBox(container, data) {
//   // Remove any previous box
//   const existingBox = container.querySelector('.latest-values-box');
//   if (existingBox) existingBox.remove();

//   // Determine the latest timestamp (assumes all traces share the same x-axis)
//   const latestTimestamps = data.map(trace => {
//     const len = trace.x.length;
//     return trace.x[len - 1]; // ISO string or Date object
//   });

//   // Use the most recent of all latest timestamps
//   const latestTimestamp = new Date(Math.max(...latestTimestamps.map(t => new Date(t).getTime())));
//   const timestampStr = latestTimestamp.toLocaleString(); // format as local date/time string

//   // Build the list of latest values
//   const latestValues = data.map(trace => {
//     const len = trace.x.length;
//     return {
//       name: trace.name || 'Trace',
//       color: trace.line?.color || '#000',
//       value: trace.y[len - 1],
//     };
//   });


//   // Position the box below the legend
//   setTimeout(() => {
//     const legend = container.querySelector('.legend');
//     if (legend) {
//       const rect = legend.getBoundingClientRect();
//       const containerRect = container.getBoundingClientRect();
//       const top = rect.top - containerRect.top + rect.height + 10;
//       const left = rect.left - containerRect.left;
//       latestValueBox.style.top = `${top}px`;
//       latestValueBox.style.left = `${left}px`;
//     } else {
//       latestValueBox.style.top = '50px';
//       latestValueBox.style.right = '10px';
//     }
//   }, 0);
// }

// day/night shading function
// function getDayNightShading(lat, lon, dataTimestamps) {
//   const startDate = new Date(dataTimestamps[0]);
//   const endDate = new Date(dataTimestamps[dataTimestamps.length - 1]);

//   // Round to local midnight
//   startDate.setHours(0, 0, 0, 0);
//   endDate.setHours(0, 0, 0, 0);

//   const MS_PER_DAY = 24 * 60 * 60 * 1000;
//   const dayCount = Math.ceil((endDate - startDate) / MS_PER_DAY) + 1;

//   const shapes = [];

//   for (let i = 0; i < dayCount; i++) {
//     const currentDay = new Date(startDate.getTime() + i * MS_PER_DAY);
//     const times = SunCalc.getTimes(currentDay, lat, lon);

//     // Add night before sunrise
//     shapes.push({
//       type: 'rect',
//       xref: 'x',
//       yref: 'paper',
//       x0: currentDay.toISOString(),
//       x1: times.sunrise.toISOString(),
//       y0: 0,
//       y1: 1,
//       fillcolor: 'rgba(255, 255, 255, 0.5)',
//       line: { width: 0 },
//       layer: 'below'
//     });

//     // Add night after sunset
//     shapes.push({
//       type: 'rect',
//       xref: 'x',
//       yref: 'paper',
//       x0: times.sunset.toISOString(),
//       x1: new Date(currentDay.getTime() + MS_PER_DAY).toISOString(),
//       y0: 0,
//       y1: 1,
//       fillcolor: 'rgba(0, 0, 0, 0.1)',
//       line: { width: 0 },
//       layer: 'below'
//     });
//   }

//   return shapes;
// }


// Show the overlay with the plot
function showPlotOverlay(data, layout, loc, attributionHTML = '') {
    const overlayDiv = document.getElementById('plotOverlay');
    const plotContainer = document.getElementById('plotContainer');
    const tableContainer = document.getElementById('tableContainer'); // new
    const closeButton = document.getElementById('plotOverlayCloseBtn');
    const infoButton = document.getElementById('infoButton');
    const infoBox = document.getElementById('infoBox');
    const pageTitleDiv = document.getElementById('page-title');

    // Clear and toggle visibility
    plotContainer.innerHTML = '';
    plotContainer.style.display = 'block';
    tableContainer.style.display = 'none';

    overlayDiv.style.display = 'block';
    updateInfoBox(loc, attributionHTML);

    closeButton.onclick = () => {
        overlayDiv.style.display = 'none';
        infoBox.style.display = 'none';
    };

    infoButton.onclick = () => {
        infoBox.style.display = (infoBox.style.display === 'none') ? 'block' : 'none';
    };

    const handleOutsideClick = (event) => {
        if (overlayDiv.style.display === 'none') return;
        const clickedOutside =
            !plotContainer.contains(event.target) &&
            !infoBox.contains(event.target) &&
            !infoButton.contains(event.target) &&
            !pageTitleDiv.contains(event.target) &&
            !closeButton.contains(event.target);

        if (clickedOutside) {
            overlayDiv.style.display = 'none';
            infoBox.style.display = 'none';
        } else if (!infoBox.contains(event.target) && event.target !== infoButton) {
            infoBox.style.display = 'none';
        }
    };

    document.addEventListener('click', handleOutsideClick);

    pageTitleDiv.addEventListener('click', () => {
        overlayDiv.style.display = 'none';
        infoBox.style.display = 'none';
    });

    Plotly.newPlot(plotContainer, data, layout, { displayModeBar: false });

    window.addEventListener('resize', () => {
        Plotly.Plots.resize(plotContainer);
    });
}


// END //////////////////////////////////////////////////////////////////////////////////////////////////////


