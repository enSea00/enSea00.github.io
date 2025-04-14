function getData_Waves_NSW(loc) {

    var name = loc.Name;
    var datatype = loc.DataType; 

    const parameterCodes = {
        "BYRBOW": { "Hsig": 1005, "Hmax": 1006, "Dir": 1007, "Tz": 1010, "Tp": 1008, "SST": 1078 },
        "COFHOW": { "Hsig": 1012, "Hmax": 1013, "Dir": 1014, "Tz": 1017, "Tp": 1015, "SST": 1079 },
        "CRHDOW": { "Hsig": 1019, "Hmax": 1020, "Dir": 1021, "Tz": 1024, "Tp": 1022, "SST": 1077 },
        "SYDDOW": { "Hsig": 991, "Hmax": 992, "Dir": 993, "Tz": 996, "Tp": 994, "SST": 1073 },
        "PTKMOW": { "Hsig": 1033, "Hmax": 1034, "Dir": 1035, "Tz": 1038, "Tp": 1036, "SST": 1076 },
        "BATBOW": { "Hsig": 998, "Hmax": 999, "Dir": 1000, "Tz": 1003, "Tp": 1001, "SST": 1075 },
        "EDENOW": { "Hsig": 1026, "Hmax": 1027, "Dir": 1028, "Tz": 1031, "Tp": 1029, "SST": 1074 }
    };

    const sitecode = loc.URL.split('-').pop().trim();
    if (!(sitecode in parameterCodes)) {
        console.error(`Site code ${sitecode} not found in parameterCodes.`);
        return;
    }

    const siteParameters = parameterCodes[sitecode];
    const idList = Object.values(siteParameters).join('%2C');

    const dataUrl = `https://api.manly.hydraulics.works/api.php?format=json&page=rawdatatable&id=${idList}&interval=&username=publicwww&token=Ujc3MzU0ZktTbTR4dEJGUmZ4aFgvMHhLeW02cS90amwvSW4vYzJrZVdhZG1oTlFuNTcvQlpBQTBLMTNSU0NiaVZ4TEh6bVJsSmZVZHJwTENMeTFWSnBMeFZmYlZ0M3lWaFhsSjlvZFViRS9FWm9iSUxtcU1WQ0JNZWF2VEExeHFCVWpucmlucTIvQTBEQitzdXp6Yk8rc2RIZE0rbmExSk9YN1VkTjlTa1JXVVVkRUZjVjV4ZWh1dW9GY2UzSVlsODRjRHU5dDExc1NsL3hyNkVaYk5YbUdpeDlBZklVNVJaay9LQmVmTlJncFlObnhobENKOE94NVh4d1daamN3ckpaWlU1aTcwcjV3UnhxRmpldERZb2c9PQ%3D%3D`;

    fetch(dataUrl)
    .then(response => response.json())
    .then(csvData => {
        if (!csvData.readings) {
            console.error('No readings found in CSV data.');
            return;
        }

        const timeStamps = Object.keys(csvData.readings);
        const timestamps = [];
        const sensorData = {};

        // Initialize empty arrays for each sensor in current site
        Object.keys(siteParameters).forEach(param => {
            sensorData[param] = [];
        });

        timeStamps.forEach(timestamp => {
            const record = csvData.readings[timestamp];
            const dt = new Date(timestamp);
            timestamps.push(dt);

            Object.keys(siteParameters).forEach(param => {
                const sensorId = siteParameters[param];
                const columnName = csvData.columns[sensorId];
                const rawValue = record[sensorId];  // Access directly using sensorId as a key
                const value = parseFloat(rawValue) === -99.9 ? NaN : parseFloat(rawValue);
                sensorData[param].push(value);
            });
        });

        // Create traces for Hsig and Hmax
        var traceHsig = {
            x: timestamps,
            y: sensorData['Hsig'],
            mode: 'lines',
            name: 'H<sub>sig</sub>',
            line: { color: '#ff7f0e' }, // Example color for Hsig
            xaxis: 'x', // Assign to the first x-axis
            yaxis: 'y1' // Assign to the first y-axis
        };

        var traceHmax = {
            x: timestamps,
            y: sensorData['Hmax'],
            mode: 'lines',
            name: 'H<sub>max</sub>',
            line: { color: '#1f77b4' }, // Example color for Hmax
            xaxis: 'x', // Assign to the first x-axis
            yaxis: 'y1' // Assign to the first y-axis
        };

        // Create traces for Tz and Tp
        var traceTz = {
            x: timestamps,
            y: sensorData['Tz'],
            mode: 'lines',
            name: 'T<sub>z</sub>',
            line: { color: '#2ca02c' }, // Example color for Tz
            yaxis: 'y2', // Assign to the second y-axis
            xaxis: 'x' // Assign to the second x-axis
        };

        var traceTp = {
            x: timestamps,
            y: sensorData['Tp'],
            mode: 'lines',
            name: 'T<sub>p</sub>',
            line: { color: '#9467bd' }, // Example color for Tp
            yaxis: 'y2', // Assign to the second y-axis
            xaxis: 'x' // Assign to the second x-axis
        };

        var traceDir = {
            x: timestamps,
            y: sensorData['Dir'],
            mode: 'lines',
            name: 'D<sub>p</sub>',
            line: { color: '#17becf' }, // Example color for Direction
            yaxis: 'y3', // Assign to the third y-axis
            xaxis: 'x' // Assign to the third x-axis
        };

        var traceSST = {
            x: timestamps,
            y: sensorData['SST'],
            mode: 'lines',
            name: 'SST',
            line: { color: 'coral' }, // Example color for SST
            yaxis: 'y4', // Assign to the fourth y-axis
            xaxis: 'x' // Assign to the fourth x-axis
        };

        // Define layout with dark theme
        var layout = {
            title: {text: datatype +': '+ name +' (Source: '+loc.Owner+')', font: { color: 'white' }},
            plot_bgcolor: 'rgba(0,0,0,0)', // Dark background for the entire plot
            paper_bgcolor: 'rgba(0,0,0,0)', // Dark background for the paper (around the plot)
            font: { color: 'white' },       // White font for the whole plot
            grid: { rows: 4, columns: 1}, // Arrange as 4-row subplot
            // Apply settings to x-axes
            xaxis: configureAxis({ title: '', showticklabels: false }),
            xaxis2: configureAxis({ title: '', showticklabels: false }),
            xaxis3: configureAxis({ title: '', showticklabels: false }),
            xaxis4: configureAxis({ title: 'Date Time (Local)' }),
            
            // Apply settings to all y-axes
            yaxis: configureAxis({ title: 'Height (m)'}),
            yaxis2: configureAxis({ title: 'Period (s)'}),
            yaxis3: configureAxis({ title: 'Dir (°N)'}),
            yaxis4: configureAxis({ title: 'SST (°C)'}),
            showlegend: true,
            margin: { l: 80, r: 20, t: 40, b: 40 },
        };
        // create data array to send to plotly layout
        var data = [traceHsig, traceHmax, traceTz, traceTp, traceDir, traceSST];
        
        const customAttribution = `
        <p>This wave buoy data is provided by the <a href="https://mhl.nsw.gov.au/Data-Wave" target="_blank">Manly Hydraulics Laboratory in the Biodiversity and Conservation Division, NSW Department of Planning and Environment</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" taret="_blank">Creative Common license (CC BY 4.0)</a>.</p>`;
        showPlotOverlay(data, layout, loc, customAttribution);
    })
    .catch(err => {
        console.error('Failed to fetch data for the plot:', err);
    });
}
