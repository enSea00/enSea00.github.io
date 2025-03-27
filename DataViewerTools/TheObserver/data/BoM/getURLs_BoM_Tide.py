import os
import requests
from bs4 import BeautifulSoup
import re
import json

list_of_states = ['nsw', 'vic', 'qld', 'sa', 'wa', 'tas', 'nt']  # ACT is under NSW

# Function to get HTML content
def get_html_content(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            return response.text
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
    return None

# Function to extract flood map links
def extract_floodmap_links(html_content):
    soup = BeautifulSoup(html_content, 'html.parser')
    floodmap = soup.find('map', {'name': 'floodmap'})
    if not floodmap:
        return []
    return [area.get('href') for area in floodmap.find_all('area') if area.get('href')]

# Function to parse station details
import re
from bs4 import BeautifulSoup

def parse_station_details(url):
    state = url.split("/")[3].upper()
    html_content = get_html_content(url)
    if not html_content:
        return []

    soup = BeautifulSoup(html_content, 'html.parser')
    map_element = soup.find('map')
    if not map_element:
        return []

    station_details = []

    for area in map_element.find_all('area'):
        onmouseover = area.get('onmouseover', '')
        pattern = r"PopupRiver\('([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)','([^']*)'\)"
        match = re.search(pattern, onmouseover)

        if match:
            name = match.group(1).strip()
            if "tide" in name.lower() or "tidal" in name.lower():
                data_type = "Tide Gauge"
            else:
                continue  # Skip river gauges

            data = {
                "DataType": data_type,
                "Name": name,
                "Longitude": float(match.group(4).strip()),
                "Latitude": float(match.group(3).strip()),
                "URL": 'http://www.bom.gov.au' + area.get('href', ''),
                "Owner": "BoM",
                "State": state,
                "Country": "Australia",
                "Notes": match.group(2).strip(),
            }

            if 'javascript:void(0)' not in data["URL"]:
                station_details.append(data)

    return station_details

# Main script
all_station_details = []

for state in list_of_states:
    print(f"Processing state: {state}")
    state_url = f"http://www.bom.gov.au/{state}/flood/"
    html_content = get_html_content(state_url)
    if not html_content:
        continue

    flood_links = extract_floodmap_links(html_content)

    for link in flood_links:
        if state in link:
            url = f'http://www.bom.gov.au{link}'
        else: 
            url = f'http://www.bom.gov.au/{state}/flood/' + link.replace('./', '')
        
        station_data = parse_station_details(url)
        all_station_details.extend(station_data)  # Flatten the list

# Get script directory
json_file_path = r'data\all_json_files\locations_tide_gauges_bom.json'

# Save to JSON file
with open(json_file_path, "w", encoding="utf-8") as json_file:
    json.dump(all_station_details, json_file, indent=4)

print(f"Saved {len(all_station_details)} station records to {json_file_path}")
