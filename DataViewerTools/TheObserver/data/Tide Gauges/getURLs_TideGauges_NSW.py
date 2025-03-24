'''
Get tide gauges MHL, NSW

Ocean Tides
- https://mhl.nsw.gov.au/Data-OceanTide -> Inspect -> find <h3>Station Locations </h3> -> copy the <ul> below into a html file, eg nsw_tide_gauges.html

Water Levels

'''

# Inputs ########################################
url_nsw_tide_gauges = r'data\Tide Gauges\nsw_tide_gauges.html'

# Packages ########################################
from bs4 import BeautifulSoup
import requests
import re
import json

# "DataType": "River Gauge",
# "Name": "BILLINUDGEL",
# "Longitude": 153.5268,
# "Latitude": -28.5016,
# "URL": "http://www.bom.gov.au/fwo/IDN60231/IDN60231.558020.plt.shtml",
# "Owner": "BoM",
# "State": "NSW",
# "Country": "Australia",
# "Notes": "558020"

# functions ########################################

def scrape_lat_long(url):
    # Fetch the webpage content
    response = requests.get(url)
    if response.status_code != 200:
        return None, None  # Return None if request fails

    # Parse the HTML
    soup = BeautifulSoup(response.text, "html.parser")

    # Find the script tag containing the metadata
    script_tags = soup.find_all("script")

    for script in script_tags:
        if "metadata = JSON.parse" in script.text:
            # Extract JSON string using regex
            match = re.search(r"metadata = JSON\.parse\('(.+?)'\);", script.text, re.DOTALL)
            if match:
                json_data = match.group(1)  # Extract JSON string

                # Fix escaped quotes and ensure valid JSON format
                json_data = json_data.replace("\\'", "'")  # Handle wrongly escaped single quotes
                json_data = json_data.replace('\\"', '"')  # Fix incorrectly escaped double quotes

                try:
                    metadata = json.loads(json_data)  # Parse JSON
                    lat = metadata.get("metadata", {}).get("latitude")
                    lon = metadata.get("metadata", {}).get("longitude")
                    return lat, lon
                except json.JSONDecodeError as e:
                    print("JSON Decode Error:", e)
                    print("Problematic JSON:", json_data[:500])  # Show part of the JSON for debugging
                    return None, None

    return None, None  # Return None if no matching script found

# Main script ########################################
# Load HTML from a file
with open(url_nsw_tide_gauges, "r", encoding="utf-8") as file:
    html = file.read()

# Parse HTML
soup = BeautifulSoup(html, "html.parser")

# Extract all station links
stations = []
for a in soup.find_all("a"):
    print(a.text.strip())
    url = r'https://mhl.nsw.gov.au'+a.get("href")
    print(url)
    lat, lon = scrape_lat_long(url)
    print(lat, lon)
    data = {
        'DataType' : 'Tide Gauge',
        'Name' : a.text.strip(),
        'Longitude' : lon,
        'Latitude' : lat,
        'URL' : url,
        'Owner' : 'MHL',
        'State' : 'NSW',
        'Country' : 'Australia',
        'Notes' :  'Station '+a.get("href").split('-')[1]
    }       

    stations.append(data)

# Save to JSON file
import json
output_json_file = r'data\Tide Gauges\locations_tide_gauges_nsw.json'
with open(output_json_file, "w", encoding="utf-8") as outfile:
    json.dump(stations, outfile, indent=4)     
