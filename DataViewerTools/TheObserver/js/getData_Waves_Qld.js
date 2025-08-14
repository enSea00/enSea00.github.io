function getData_Waves_Qld(loc) {
    return new Promise((resolve, reject) => {
        var name = loc.Name;

        var data = {
            resource_id: '2bbef99e-9974-49b9-a316-57402b00609c',
            limit: 1000,
            q: name
        };

        $.ajax({
            url: 'https://www.data.qld.gov.au/api/3/action/datastore_search',
            data: data,
            dataType: 'json',
            success: function(response) {
                if (response.result && response.result.records) {
                    var records = response.result.records;

                    // Sort records by DateTime
                    records.sort((a, b) => new Date(a.DateTime) - new Date(b.DateTime));

                    var observations = [];

                    // Extract and clean data
                    records.forEach(record => {
                        observations.push({
                            timestamp: new Date(record['DateTime']),
                            Hsig: (parseFloat(record['Hsig']) === -99.9) ? NaN : parseFloat(record['Hsig']),
                            Hmax: (parseFloat(record['Hmax']) === -99.9) ? NaN : parseFloat(record['Hmax']),
                            Tz:   (parseFloat(record['Tz'])   === -99.9) ? NaN : parseFloat(record['Tz']),
                            Tp:   (parseFloat(record['Tp'])   === -99.9) ? NaN : parseFloat(record['Tp']),
                            Dp:  (parseFloat(record['Direction']) === -99.9) ? NaN : parseFloat(record['Direction']),
                            SST:  (parseFloat(record['SST'])  === -99.9) ? NaN : parseFloat(record['SST']),
                            Current: (parseFloat(record['Current Speed']) === -99.9) ? NaN : parseFloat(record['Current Speed'])
                        });
                    });

                    resolve(observations);

                    // define name map from raw variable names to standard names used in the web page names
                    const variableNameMap = {
                        Hsig: "H<sub>sig</sub> (m)",
                        Hmax: "H<sub>max</sub> (m)",
                        Tp: "T<sub>p</sub> (s)",
                        Tz: "T<sub>z</sub> (s)",
                        Dp: "D<sub>p</sub> (°T)",
                        SST: "SST (°C)",
                        Current: "Current (m/s)",
                    };

                    // define subplot groups (variables sharing same subplot axes)
                    let subplotGroups = [['H<sub>sig</sub> (m)',"H<sub>max</sub> (m)"],
                        ["T<sub>p</sub> (s)","T<sub>z</sub> (s)"],
                        ["D<sub>p</sub> (°N)"],
                        ["SST (°C)"],
                        ['Current (m/s)']
                    ]

                    // make the plotly plot
                    const { traces, layout } = createTimeseriesSubplots(observations, variableNameMap, subplotGroups, loc);

                    // make the plot overlay
                    const customAttribution = `
                        <p>This wave buoy data is provided by the <a href="https://www.qld.gov.au/environment/coasts-waterways/beach/monitoring" target="_blank">Queensland Government</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Common license (CC BY 4.0)</a>.</p>
                        `;
                   
                    showPlotOverlay(traces, layout, loc, customAttribution);
                    
                } else {
                    reject("No records found in response.");
                }
            },
            error: function(xhr, status, error) {
                reject(`Error fetching data: ${status} - ${error}`);
            }
        });
    });
}
