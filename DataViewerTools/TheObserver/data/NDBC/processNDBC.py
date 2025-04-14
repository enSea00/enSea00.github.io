'''
1. get station list from url_station_list
2. get location info from url_json_data
'''

# URLs
url_station_list = 'https://www.ndbc.noaa.gov/to_station.shtml'
url_json_data = 'https://www.ndbc.noaa.gov/ndbcmapstations.json'

# Imports
import requests
from bs4 import BeautifulSoup
import re
import json
import os

# Function to fetch station IDs from HTML
def fetch_station_ids(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.content, 'html.parser')
    station_ids = set()
    for a_tag in soup.find_all('a', href=True):
        match = re.search(r'station_page\.php\?station=([A-Z0-9]+)', a_tag['href'])
        if match:
            station_ids.add(match.group(1))
    return sorted(station_ids)

# Function to fetch and parse JSON station metadata
def fetch_json_from_url(url):
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        data = response.json()
        stations = data.get("station", [])
        owners = data.get("owner", [])
        return stations, owners
    except requests.exceptions.RequestException as e:
        print(f"Error fetching JSON: {e}")
        return [], []

# Fetch station IDs from HTML
stations = fetch_station_ids(url_station_list)

# Fetch metadata from JSON
station_data, owners = fetch_json_from_url(url_json_data)

# Create lookup dict from JSON stations
station_lookup = {s['id'].upper(): s for s in station_data}

# Match HTML station IDs to JSON data and build location list
locations = []
for station_id in stations:
    station_info = station_lookup.get(station_id)
    if station_info:
        url = f'https://www.ndbc.noaa.gov/station_page.php?station={station_id}'
        owner_name = owners[station_info["owner"]] if isinstance(station_info["owner"], int) and station_info["owner"] < len(owners) else "Unknown"
        data_type = 'Ocean Buoy (Active)' if station_info.get("data") == "y" else 'Ocean Buoy (Historical)'

        data = {
            "DataType": data_type,
            "Name": station_info.get("name", ""),
            "Longitude": station_info.get("lon"),
            "Latitude": station_info.get("lat"),
            "URL": url,
            "Owner": "NDBC", #f"NDBC {owner_name}",
            "State": "",
            "Country": "",
            "Notes": data_type,
        }
        locations.append(data)

# Output JSON
output_dir = 'data/all_json_files'
os.makedirs(output_dir, exist_ok=True)
json_path = os.path.join(output_dir, 'locations_ndbc.json')

with open(json_path, mode='w', encoding='utf-8') as json_file:
    json.dump(locations, json_file, indent=4)

print(f"✅ {len(locations)} matched stations written to {json_path}")

