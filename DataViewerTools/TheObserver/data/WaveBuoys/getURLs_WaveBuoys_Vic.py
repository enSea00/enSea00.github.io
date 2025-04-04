'''

download/copy json data from 'https://vicwaves.com.au/wp-json/waves/v1/list?type=all'
run this script

for future

timeseries data can be obtained via - https://vicwaves.com.au/wp-json/waves/v1/buoys/{id}?type=waves&simplified=1, eg https://vicwaves.com.au/wp-json/waves/v1/buoys/11001?type=waves&simplified=1

'''


file_path = r'data\WaveBuoys\vic_waves_list.json'
output_path = r'data\all_json_files\locations_waves_vic.json'
import json

# Open and load the JSON data from the file, specifying encoding
with open(file_path, 'r', encoding='utf-8-sig') as file:
    json_data = json.load(file)

# Iterate through each entry and extract relevant fields if they exist
locations = []
for entry in json_data:
    # Check if the entry contains the required fields
    if "label" in entry and "lat" in entry and "lng" in entry and "web_display_name" in entry:
        site_info = {'DataType': 'Wave Buoy'}
        site_info['Name'] = entry["web_display_name"]
        site_info['Longitude'] = float(entry["lng"])
        site_info['Latitude'] = float(entry["lat"])
        site_info['URL'] = 'https://vicwaves.com.au/'
        site_info['Owner'] = 'Vic Gov'
        site_info['State'] = 'VIC'
        site_info['Country'] = 'Australia'
        site_info['Notes'] = f'id={entry["id"]}, label={entry["label"]}'

        locations.append(site_info)

with open(output_path, 'w', encoding='utf-8') as json_file:
        json.dump(locations, json_file, indent=4)

