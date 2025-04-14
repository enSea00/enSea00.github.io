'''

'''


1. leaflet marker click
2. get sitecode from marker URL
    {
        "DataType": "Wave Buoy",
        "Name": "Coffs Harbour",
        "Longitude": 153.25888893,
        "Latitude": -30.37277778,
        "URL": "https://mhl.nsw.gov.au/Station-COFHOW",
        "Owner": "MHL",
        "State": "NSW",
        "Country": "Australia",
        "Notes": "Source DCCEEW CPHR"
    },

3. parse parameter codes from api
apiurl = 'https://api.manly.hydraulics.works/api.php?username=publicwww&token=Ujc3MzU0ZktTbTR4dEJGUmZ4aFgvMHhLeW02cS90amwvSW4vYzJrZVdhZG1oTlFuNTcvQlpBQTBLMTNSU0NiaVZ4TEh6bVJsSmZVZHJwTENMeTFWSnBMeFZmYlZ0M3lWaFhsSjlvZFViRS9FWm9iSUxtcU1WQ0JNZWF2VEExeHFCVWpucmlucTIvQTBEQitzdXp6Yk8rc2RIZE0rbmExSk9YN1VkTjlTa1JXVVVkRUZjVjV4ZWh1dW9GY2UzSVlsODRjRHU5dDExc1NsL3hyNkVaYk5YbUdpeDlBZklVNVJaay9LQmVmTlJncFlObnhobENKOE94NVh4d1daamN3ckpaWlU1aTcwcjV3UnhxRmpldERZb2c9PQ%3D%3D'

4. parse wave data from api  