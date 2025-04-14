function getData_Tides_Qld(loc) {
    // var name = loc.Name;
    var datatype = loc.DataType; 

    // determine qld gov data source (storm tide or standard tide apis)
    if (loc.URL.includes('storm')) {
        var gauge_type = 'storm'; // Get the gauge type from the location object
        var resource_id = '7afe7233-fae0-4024-bc98-3a72f05675bd';
    }
    else {
        var gauge_type = 'tide'; // Get the gauge type from the location object
        var resource_id = '1311fc19-1e60-444f-b5cf-24687f1c15a7';
    }
    
    // var name = loc.URL.split('/').pop().replace(/-/g, ''); // this doesnt catch all locations due tpo mismatches between csv file and web page naming conventions
    // const str = "storm | ugar";
    var name = loc.Notes.split('|')[1]?.trim();
    console.log(name)
    if (!name) {
        window.open(loc.URL, '_blank');
        return; // Exit the function if name is undefined, null, or empty string
    }    

    var data = {
        resource_id: resource_id, // Resource ID
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
                // Check if records are empty
                if (records.length === 0) {
                    console.error("No records found for the specified location.");
                    return;
                }
                // Sort the records array by DateTime (earliest to latest)
                records.sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));

                var timestamps = [];
                var WaterLevel = [];
                var Prediction = [];
                var Residual = [];

                // Extract data from records
                records.forEach(record => {
                    const dt = new Date(record['DateTime']);
                    timestamps.push(dt);
                    // Replace -99. with NaN for each relevant data point
                    WaterLevel.push((parseFloat(record['Water Level']) === -99.) ? NaN : parseFloat(record['Water Level']));
                    Prediction.push((parseFloat(record['Prediction']) === -99.) ? NaN : parseFloat(record['Prediction']));
                    Residual.push((parseFloat(record['Residual']) === -99.) ? NaN : parseFloat(record['Residual']));
                });

                // Create traces for WaterLevel and Prediction
                var traceWaterLevel = {
                    x: timestamps,
                    y: WaterLevel,
                    mode: 'lines',
                    name: 'Observed',
                    line: { color: '#ff7f0e' }, // Example color for WaterLevel
                    xaxis: 'x', // Assign to the first x-axis
                    yaxis: 'y1' // Assign to the first y-axis
                };

                var tracePrediction = {
                    x: timestamps,
                    y: Prediction,
                    mode: 'lines',
                    name: 'Prediction',
                    line: { color: '#1f77b4' }, // Example color for Prediction
                    xaxis: 'x', // Assign to the first x-axis
                    yaxis: 'y1' // Assign to the first y-axis
                };

                // Create traces for Residual and Tp
                var traceResidual = {
                    x: timestamps,
                    y: Residual,
                    mode: 'lines',
                    name: 'Residual',
                    line: { color: '#2ca02c' }, // Example color for Residual
                    yaxis: 'y2', // Assign to the second y-axis
                    xaxis: 'x' // Assign to the second x-axis
                };

                // Define layout with dark theme
                var layout = {
                    title: {text: datatype +': '+ loc.Name +' (Source: '+loc.Owner+')', font: { color: 'white' }},
                    plot_bgcolor: 'rgba(0,0,0,0)', // Dark background for the entire plot
                    paper_bgcolor: 'rgba(0,0,0,0)', // Dark background for the paper (around the plot)
                    font: { color: 'white' },       // White font for the whole plot
                    grid: { rows: 2, columns: 1}, // Arrange as 4-row subplot
                    
                    // Apply settings to x-axes
                    xaxis: configureAxis({ title: '' }),
                    xaxis2: configureAxis({ title: 'Date Time (Local)' }),
                    
                    // Apply settings to all y-axes
                    yaxis: configureAxis({ title: 'Level (m)'}),
                    yaxis2: configureAxis({ title: 'Residual (m)'}),

                    showlegend: true,
                    margin: { l: 80, r: 20, t: 40, b: 40 },
                };
                // create data array to send to plotly layout
                var data = [traceWaterLevel, tracePrediction, traceResidual];

                // Make the plot overlay
                const customAttribution = `
                    <p>This tide gauge data is provided by the <a href="https://www.qld.gov.au/environment/coasts-waterways/beach/tide-sites" target="_blank">Queensland Government</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" taret="_blank">Creative Common license (CC BY 4.0)</a>.</p>
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
