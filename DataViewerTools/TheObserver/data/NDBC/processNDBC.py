'''

'''

# inputs
url_json_data = 'https://www.ndbc.noaa.gov/ndbcmapstations.json'


# packages 
import requests

# processing
def fetch_json_from_url(url):
    try:
        # Fetch the JSON data from the URL
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)

        # Parse JSON
        data = response.json()

        # Extract the 'station' list
        stations = data.get("station", [])
        owners = data.get("owner", [])

        return stations, owners  # Returns a list of station dictionaries

    except requests.exceptions.RequestException as e:
        print(f"Error fetching JSON: {e}")
        return []

# Example usage
station_data, owners = fetch_json_from_url(url_json_data)

        # "DataType": "River Gauge",
        # "Name": "BILLINUDGEL",
        # "Longitude": 153.5268,
        # "Latitude": -28.5016,
        # "URL": "http://www.bom.gov.au/fwo/IDN60231/IDN60231.558020.plt.shtml",
        # "Owner": "BoM",
        # "State": "NSW",
        # "Country": "Australia",
        # "Notes": "558020"

# Print the parsed station data
locations = []
for station in station_data:
    url = 'https://www.ndbc.noaa.gov/station_page.php?station=' + station["id"].upper()
    owner = owners[station["owner"]]
    if station["data"] == "n":
        data_type = 'Ocean Buoy (Historical)'
    else:
        data_type = 'Ocean Buoy (Active)'

    data = {
        "DataType": data_type,
        "Name": station["name"],
        "Longitude": station["lon"],
        "Latitude": station["lat"],
        "URL": url,
        "Owner": "NDBC "+owner,
        "State": "",
        "Country": "",
        "Notes": data_type,
    }
    locations.append(data)

# write json    
import json
json_file = r'data\all_json_files\locations_ndbc.json'  
with open(json_file, mode='w', encoding='utf-8') as json_file:
    json.dump(locations, json_file, indent=4)


