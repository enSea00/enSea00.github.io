'''
get urls 

- https://worldweather.wmo.int/en/dataguide.html

there are no urls
'''

# Inputs
import json
import requests
import time
import os

# Inputs
location_list_file = r'data\WMO\world_city_list.txt'
output_json_file = r'data\all_json_files\locations_wmo.json'

# Ensure output directory exists
os.makedirs(os.path.dirname(output_json_file), exist_ok=True)

# Function to get latitude, longitude, and API URL
def get_lat_lon(city_id):
    url = f"https://worldweather.wmo.int/en/json/{city_id}_en.json"
    # print(f"Fetching: {url}")
    
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()  # Raise error for bad responses (4xx, 5xx)
        data = response.json()

        # Extract lat/lon from JSON response
        city_info = data.get("city", {})
        lat = city_info.get("cityLatitude", "N/A")
        lon = city_info.get("cityLongitude", "N/A")

        # Convert lat/lon to float if possible
        try:
            lat = float(lat)
            lon = float(lon)
        except ValueError:
            lat, lon = "N/A", "N/A"

        return lat, lon, url
    except requests.exceptions.RequestException as e:
        print(f"Error fetching data for CityId {city_id}: {e}")
        return "N/A", "N/A", url

# Open the text file and parse it
with open(location_list_file, "r", encoding="utf-8") as file:
    lines = file.readlines()

# Extract headers and remove quotes
headers = lines[0].strip().replace('"', '').split(";")
# Process the data
data = []
for ii, line in enumerate(lines[1:], start=1):  # Start index at 1 for readability
    print(f'Processing location {ii} of {len(lines[1:])} ...')
    values = line.strip().replace('"', '').split(";")
    entry = dict(zip(headers, values))  # Convert to dictionary

    # Fetch latitude, longitude, and URL
    city_id = entry["CityId"]
    lat, lon, url = get_lat_lon(city_id)

    # Add lat/lon and API URL to entry
    entry["Latitude"] = lat
    entry["Longitude"] = lon
    entry["URL"] = url  # Store API URL for reference


        # Reorder keys at the end
    ordered_entry = {
        "DataType" : "Weather",
        "Name": entry["City"],
        "Latitude": entry["Latitude"],
        "Longitude": entry["Longitude"],
        "URL": f'https://worldweather.wmo.int/en/city.html?cityId={entry["CityId"]}',
        "Owner" : "WMO",
        "State" : "",
        "Country": entry["Country"],
        "Notes": f'City ID {entry["CityId"]}',
    }

    data.append(ordered_entry)

    # Pause between requests to avoid being blocked
    time.sleep(1)

# Convert list to JSON
json_output = json.dumps(data, indent=4)

# Save to a JSON file
with open(output_json_file, "w", encoding="utf-8") as json_file:
    json_file.write(json_output)

print(f"JSON file saved to {output_json_file}")





# url = f'https://worldweather.wmo.int/en/json/{City ID}_en.json'