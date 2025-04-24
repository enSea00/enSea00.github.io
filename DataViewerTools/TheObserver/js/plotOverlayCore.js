// Definitions by DataType
const definitionsByType = {
    'Weather Station' :`
        <h3>Definitions</h3>
            <ul>
                <li>air_temp - Ambient air temperature  (°C)</li>
                <li>apparent_t - Steadman apparent air temprature (°C) <a href="http://www.bom.gov.au/info/thermal_stress/" target="_blank">More information</a></li>
                <li>dewpt - dew point temperature (°C)</li>
                <li>rel_hum - Relative humidity (%)	</li>
                <li>wind_dir - Wind direction relative to True North (°C), from which the wind is blowing</li>
                <li>wind_spd_kmh - Wind speed (km/h) averaged over 10 minutes </li>
                <li>gust_kmh - Wind gust (km/h)	measured over 3 seconds </li>
                <li>rain_trace - Rain since 9 am (mm)</li>
                <li>press - Station level atmospheric pressure (hPa)</li>
                <li>press_msl - Atmospheric pressure reduced to mean sea level (hPa)</li>
                <li>press_qnh - QNH pressure. The correction from station level pressure to QNH pressure is based on the conditions specified by the International Standard Atmosphere. QNH pressure is used by pilots to set the altimeter of their aircraft. QNH pressure is closely related to Mean Sea Level Pressure (MSLP) at low elevations, and can vary significantly from MSLP at high elevations.</li>
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

// Disclaimer
const disclaimerHTML = `<h3>Disclaimer</h3>
                        <p>The data shown has not been quality controlled. For quality controlled data you should contact the attributed provider directly.`

// Update info box content
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
//  axis config
function configureAxis(axis) {
    return {
        title: {text: axis.title},   // Axis title
        // domain: axis.domain,         // Axis domain (position)
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


// table
function showTableOverlay(tableHTML, loc, attributionHTML = '') {
    // console.log(tableHTML)
    const overlayDiv = document.getElementById('plotOverlay');
    const tableContainer = document.getElementById('tableContainer');
    const plotContainer = document.getElementById('plotContainer'); // new
    const closeButton = document.getElementById('plotOverlayCloseBtn');
    const infoButton = document.getElementById('infoButton');
    const infoBox = document.getElementById('infoBox');
    const pageTitleDiv = document.getElementById('page-title');

    // Clear and toggle visibility
    tableContainer.innerHTML = `
        <div class="tide-table-wrapper overflow-auto bg-white text-black p-4 rounded-md shadow-md max-h-[80vh]">
            ${tableHTML}
        </div>
    `;
    tableContainer.style.display = 'block';
    plotContainer.style.display = 'none';

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
            !tableContainer.contains(event.target) &&
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
}


