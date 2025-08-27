function getData_Waves_NSW(loc) {
    return new Promise((resolve, reject) => {
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
            reject(`Site code ${sitecode} not found in parameterCodes.`);
            return;
        }

        const siteParameters = parameterCodes[sitecode];
        const idList = Object.values(siteParameters).join('%2C');

        const dataUrl = `https://api.manly.hydraulics.works/api.php?format=json&page=rawdatatable&id=${idList}&interval=&username=publicwww&token=Ujc3MzU0ZktTbTR4dEJGUmZ4aFgvMHhLeW02cS90amwvSW4vYzJrZVdhZG1oTlFuNTcvQlpBQTBLMTNSU0NiaVZ4TEh6bVJsSmZVZHJwTENMeTFWSnBMeFZmYlZ0M3lWaFhsSjlvZFViRS9FWm9iSUxtcU1WQ0JNZWF2VEExeHFCVWpucmlucTIvQTBEQitzdXp6Yk8rc2RIZE0rbmExSk9YN1VkTjlTa1JXVVVkRUZjVjV4ZWh1dW9GY2UzSVlsODRjRHU5dDExc1NsL3hyNkVaYk5YbUdpeDlBZklVNVJaay9LQmVmTlJncFlObnhobENKOE94NVh4d1daamN3ckpaWlU1aTcwcjV3UnhxRmpldERZb2c9PQ%3D%3D`;

        fetch(dataUrl)
        .then(response => response.json())
        .then(csvData => {
            if (!csvData.readings) {
                reject("No readings found in NSW data.");
                return;
            }

            const timeStamps = Object.keys(csvData.readings);
            let observations = [];

            timeStamps.forEach(timestamp => {
                const record = csvData.readings[timestamp];
                const dt = new Date(timestamp);

                observations.push({
                    timestamp: dt,
                    Hsig: parseFloat(record[siteParameters["Hsig"]]) === -99.9 ? NaN : parseFloat(record[siteParameters["Hsig"]]),
                    Hmax: parseFloat(record[siteParameters["Hmax"]]) === -99.9 ? NaN : parseFloat(record[siteParameters["Hmax"]]),
                    Tz:   parseFloat(record[siteParameters["Tz"]])   === -99.9 ? NaN : parseFloat(record[siteParameters["Tz"]]),
                    Tp:   parseFloat(record[siteParameters["Tp"]])   === -99.9 ? NaN : parseFloat(record[siteParameters["Tp"]]),
                    Dp:   parseFloat(record[siteParameters["Dir"]])  === -99.9 ? NaN : parseFloat(record[siteParameters["Dir"]]),
                    SST:  parseFloat(record[siteParameters["SST"]])  === -99.9 ? NaN : parseFloat(record[siteParameters["SST"]])
                });
            });

            resolve(observations);

            // variable display names
            const variableNameMap = {
                Hsig: "H<sub>sig</sub> (m)",
                Hmax: "H<sub>max</sub> (m)",
                Tp: "T<sub>p</sub> (s)",
                Tz: "T<sub>z</sub> (s)",
                Dp: "D<sub>p</sub> (°N)",
                SST: "SST (°C)"
            };

            // subplot grouping
            let subplotGroups = [
                ['H<sub>sig</sub> (m)', "H<sub>max</sub> (m)"],
                ["T<sub>p</sub> (s)", "T<sub>z</sub> (s)"],
                ["D<sub>p</sub> (°N)"],
                ["SST (°C)"]
            ];

            const { traces, layout } = createTimeseriesSubplots(observations, variableNameMap, subplotGroups, loc);

            const customAttribution = `
                <p>This wave buoy data is provided by the <a href="https://mhl.nsw.gov.au/Data-Wave" target="_blank">Manly Hydraulics Laboratory in the Biodiversity and Conservation Division, NSW Department of Planning and Environment</a> under a <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank">Creative Common license (CC BY 4.0)</a>.</p>`;

            showPlotOverlay(traces, layout, loc, customAttribution);
        })
        .catch(err => {
            reject(`Failed to fetch NSW data: ${err}`);
        });
    });
}
