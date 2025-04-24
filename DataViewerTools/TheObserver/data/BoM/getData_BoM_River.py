from bs4 import BeautifulSoup
import requests
import json
import os
import time
import math
import re

# Load your JSON file with URLs
json_file_path = r'data\all_json_files\locations_river_bom.json'
output_path = r'data\BoM\river'

# 
with open(json_file_path, 'r') as file:
    data = json.load(file)
N = len(data)

os.makedirs(output_path, exist_ok=True)

headers = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json",
    "Referer": "http://www.bom.gov.au/",
}

def parse_river_html(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')

    # ----- Parse station info and flood levels -----
    site_info = {
        'station_number': None,
        'name': None,
        'owner': None,
        'url' : None,
        'minor_flood_level': None,
        'moderate_flood_level': None,
        'major_flood_level': None
    }

    flood_section = soup.find('p', class_='stationdetails')
    if flood_section:
        text = flood_section.get_text(separator=' ', strip=True)

# Extract using regex
    station_match = re.search(r'Station Number:\s*(\d+)', text)
    name_match = re.search(r'Name:\s*(.*?)\s*(Owner:|Flood levels:)', text)
    owner_match = re.search(r'Owner:\s*([^F]+)', text)
    minor_match = re.search(r'Minor:\s*([\d.]+)', text)
    moderate_match = re.search(r'Moderate:\s*([\d.]+)', text)
    major_match = re.search(r'Major:\s*([\d.]+)', text)

    if station_match:
        site_info['station_number'] = station_match.group(1)
    if name_match:
        site_info['name'] = name_match.group(1).strip()
    if owner_match:
        site_info['owner'] = owner_match.group(1).strip()
    if minor_match:
        site_info['minor_flood_level'] = float(minor_match.group(1))
    if moderate_match:
        site_info['moderate_flood_level'] = float(moderate_match.group(1))
    if major_match:
        site_info['major_flood_level'] = float(major_match.group(1))

    # ----- Parse table data -----
    timeseries_data = []
    table = soup.find('table', class_='tabledata')
    if table:
        rows = table.find_all('tr')[1:]  # skip header
        for row in rows:
            cols = row.find_all('td')
            if len(cols) >= 2:
                try:
                    timeseries_data.append({
                        'datetime': cols[0].get_text(strip=True),
                        'height_m': float(cols[1].get_text(strip=True))
                    })
                except ValueError:
                    continue

    return {
        "site_info": site_info,
        "data": timeseries_data
    }

# ----- Download and parse -----
start_time = time.time()

for i in range(min(N, len(data))):
    url = data[i]["URL"].replace('plt', 'tbl')
    print(f"Processing file {i+1} of {min(N, len(data))} ({url}) ...")
    file_name = os.path.basename(url).replace('shtml', 'json').replace('.tbl','')

    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            parsed = parse_river_html(response.content)
            parsed['site_info']['url'] = url
            output_file = os.path.join(output_path, file_name)
            with open(output_file, 'w') as f:
                json.dump(parsed, f, indent=2)
            # print(f"Parsed and saved: {file_name}")
        else:
            print(f"Failed to fetch {url} — Status: {response.status_code}")
    except Exception as e:
        print(f"Error fetching {url}: {e}")

elapsed = time.time() - start_time
print(f"\nFinished in {elapsed:.2f} seconds.")

