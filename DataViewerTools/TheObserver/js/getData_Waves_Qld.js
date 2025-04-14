function getData_Waves_Qld(loc) {
    var name = loc.Name;
    var datatype = loc.DataType; 
    var lat = loc.Latitude; // Extract latitude from latlng object
    var lon = loc.Longitude; // Extract longitude from latlng object

    var data = {
        resource_id: '2bbef99e-9974-49b9-a316-57402b00609c', // Resource ID
        limit: 1000, // Get up to 1000 records
        q: name // Use the name passed from the marker as the query (e.g., 'Caloundra')
    };

    $.ajax({
        url: 'https://www.data.qld.gov.au/api/3/action/datastore_search',
        data: data,
        dataType: 'json',
        success: function(response) {
            if (response.result && response.result.records) {
                var records = response.result.records;

                // Sort the records array by DateTime (earliest to latest)
                records.sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));

                var timestamps = [];
                var Hsig = [];
                var Hmax = [];
                var Tz = [];
                var Tp = [];
                var Dir = [];
                var SST = [];
                var Current = [];

                // Extract data from records
                records.forEach(record => {
                    const dt = new Date(record['DateTime']);
                    timestamps.push(dt);

                    // Replace -99.9 with NaN for each relevant data point
                    Hsig.push((parseFloat(record['Hsig']) === -99.9) ? NaN : parseFloat(record['Hsig']));
                    Hmax.push((parseFloat(record['Hmax']) === -99.9) ? NaN : parseFloat(record['Hmax']));
                    Tz.push((parseFloat(record['Tz']) === -99.9) ? NaN : parseFloat(record['Tz']));
                    Tp.push((parseFloat(record['Tp']) === -99.9) ? NaN : parseFloat(record['Tp']));
                    Dir.push((parseFloat(record['Direction']) === -99.9) ? NaN : parseFloat(record['Direction']));
                    SST.push((parseFloat(record['SST']) === -99.9) ? NaN : parseFloat(record['SST']));
                    Current.push((parseFloat(record['Current Speed']) === -99.9) ? NaN : parseFloat(record['Current Speed']));
                });

                // Create traces for Hsig and Hmax
                var traceHsig = {
                    x: timestamps,
                    y: Hsig,
                    mode: 'lines',
                    name: 'H<sub>sig</sub>',
                    line: { color: '#ff7f0e' }, // Example color for Hsig
                    xaxis: 'x', // Assign to the first x-axis
                    yaxis: 'y1' // Assign to the first y-axis
                };

                var traceHmax = {
                    x: timestamps,
                    y: Hmax,
                    mode: 'lines',
                    name: 'H<sub>max</sub>',
                    line: { color: '#1f77b4' }, // Example color for Hmax
                    xaxis: 'x', // Assign to the first x-axis
                    yaxis: 'y1' // Assign to the first y-axis
                };

                // Create traces for Tz and Tp
                var traceTz = {
                    x: timestamps,
                    y: Tz,
                    mode: 'lines',
                    name: 'T<sub>z</sub>',
                    line: { color: '#2ca02c' }, // Example color for Tz
                    yaxis: 'y2', // Assign to the second y-axis
                    xaxis: 'x' // Assign to the second x-axis
                };

                var traceTp = {
                    x: timestamps,
                    y: Tp,
                    mode: 'lines',
                    name: 'T<sub>p</sub>',
                    line: { color: '#9467bd' }, // Example color for Tp
                    yaxis: 'y2', // Assign to the second y-axis
                    xaxis: 'x' // Assign to the second x-axis
                };

                var traceDir = {
                    x: timestamps,
                    y: Dir,
                    mode: 'lines',
                    name: 'D<sub>p</sub>',
                    line: { color: '#17becf' }, // Example color for Direction
                    yaxis: 'y3', // Assign to the third y-axis
                    xaxis: 'x' // Assign to the third x-axis
                };

                var traceSST = {
                    x: timestamps,
                    y: SST,
                    mode: 'lines',
                    name: 'SST',
                    line: { color: 'coral' }, // Example color for SST
                    yaxis: 'y4', // Assign to the fourth y-axis
                    xaxis: 'x' // Assign to the fourth x-axis
                };

                var traceCurrent = {
                    x: timestamps,
                    y: Current,
                    mode: 'lines',
                    name: 'Current',
                    line: { color: 'lightgreen' }, // Example color for Current
                    yaxis: 'y5', // Assign to the fifth y-axis
                    xaxis: 'x' // Assign to the fifth x-axis
                };

                // Define layout with dark theme
                var layout = {
                    // title: {text: datatype +': '+ name +' ('+latlng.lng+'°E, '+latlng.lat+'°N)', font: { color: 'white' }},
                    title: {text: datatype +': '+ name +' (Source: '+loc.Owner+')', font: { color: 'white' }},
                    plot_bgcolor: 'rgba(0,0,0,0)', // Dark background for the entire plot
                    paper_bgcolor: 'rgba(0,0,0,0)', // Dark background for the paper (around the plot)
                    font: { color: 'white' },       // White font for the whole plot
                    grid: { rows: 5, columns: 1}, // Arrange as 4-row subplot
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
                    yaxis5: configureAxis({ title: 'Current (m/s)'}),
                    showlegend: true,
                    margin: { l: 80, r: 20, t: 40, b: 40 },
                };
                // create data array to send to plotly layout
                var data = [traceHsig, traceHmax, traceTz, traceTp, traceDir, traceSST, traceCurrent];

                // Make the plot overlay
                const customAttribution = `
                <p>This wave buoy data is provided by the <a href="https://www.qld.gov.au/environment/coasts-waterways/beach/monitoring" target="_blank">Queensland Government</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" taret="_blank">Creative Common license (CC BY 4.0)</a>.</p>
                `;
                showPlotOverlay(data, layout, loc, customAttribution);
                
            } else {
                console.error("No records found in response.");
            }
        },
        error: function(xhr, status, error) {
            console.error("Error fetching data:", status, error);
            console.log("Full error response:", xhr);
        }
    });
}
