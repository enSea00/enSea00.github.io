// Definitions by DataType - this is displayed via the "info" popup on the timeseries plt overlay
// format is definitionByType = {'DataType' : 'Definition text to display'} where DataType is as per the locations_all.js database
const definitionsByType = {
    'Weather Station' :`
        <h3>Definitions</h3>
            <ul>
                <li>T<sub>a</sub> - Ambient air temperature (°C)</li>
                <li>T<sub>d</sub> - dew point temperature (°C)</li>
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

// TIMSERIES PLOT FUNCTIONS ////////////////////////////////////////////////////////////////////////////////////////

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
    
            traces.push({
                x: timestamps,
                y: yData,
                name: variable,
                line: { color: variableColors[variable] },
                xaxis: `x`,
                yaxis: `y${index + 1}`,
                mode: "lines",
                connectgaps: false,
                type: "scatter",
                hovertemplate: yData.every(v => v === null)
                    ? '' // suppress hover entirely
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

    });
  
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


