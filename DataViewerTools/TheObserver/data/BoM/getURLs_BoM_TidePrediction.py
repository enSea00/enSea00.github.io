# """
# Get Tide Prediction information from BoM

# Site files (cf http://www.bom.gov.au/australia/tides/scripts/config.js): - for lat lon data
# - http://www.bom.gov.au/australia/tides/tide_prediction_sites.json
# - http://www.bom.gov.au/australia/tides/tide_stream_prediction_sites.json

# Href List - for hrefs
# http://www.bom.gov.au/australia/tides/, right click Inspect -> Elements -> find div id=location-list -> right click -> copy element -> sva ein standalone file
# """

# Inputs
location_jsonfile = r'data\BoM\tide_prediction_sites.json'    # location data from url above
href_htmlfile = r'data\BoM\tide_prediction_hrefs.html'  # href data copied manually as above
output_json_file = r'data\all_json_files\locations_tide_predictions.json'

# packages
import re
import json
from bs4 import BeautifulSoup

# functions
def extract_links_from_file(html_file):
    """Extract href, id, and name from an HTML file."""
    with open(html_file, 'r', encoding='utf-8') as file:
        soup = BeautifulSoup(file, 'html.parser')

    href_data = []
    
    for a in soup.find_all('a', href=True):
        href = a['href']
        if href.startswith('#!/'):
            url = 'http://www.bom.gov.au/australia/tides/'+a['href']
            link_id = a.get('id', 'N/A')  # Get ID or return 'N/A' if missing
            name = a.get_text(strip=True)  # Get the link text (name)
            href_data.append({'href': url, 'id': link_id, 'name': name})
    
    return href_data

def merge_location_data_with_links(location_data, href_data):
    """Merge href from href_data into location_data where Notes matches id."""
    href_map = {item["id"]: item["href"] for item in href_data}  # Create lookup dictionary
    
    for entry in location_data:
        if entry["Notes"] in href_map:  # Match Notes with extracted id
            entry["URL"] = href_map[entry["Notes"]]
        else: # location's href is missing from the href_html so reconstruct - note that the url does NOT zoom to location though - BoM side issue because not in "locations-list"
            state = entry["Notes"].split('_')[0].lower()
            if state == 'int':
                state = 'offshore'
            port_name = re.sub(r"[()\s]+", "-", entry["Name"].lower()).strip("-")
            entry["URL"] = f'http://www.bom.gov.au/australia/tides/#!/{state}-{port_name}'
        
    return location_data

# Example usage
html_file = href_htmlfile
geojson_file = location_jsonfile

# Load JSON data (assuming GeoJSON format)
with open(geojson_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Parse GeoJSON data
location_data = []
for feature in data["features"]:
    properties = feature["properties"]

    # Format port name: lowercase, remove brackets, replace spaces with hyphens
    port_name = re.sub(r"[()\s]+", "-", properties["PORT_NAME"].lower()).strip("-")

    location_data.append({
        "DataType": "Tide Prediction",
        "Name": properties["PORT_NAME"],
        "Longitude": properties["LON"],
        "Latitude": properties["LAT"],
        # "URL": url,
        "Owner": "BoM",
        "State": properties["STATE_NAME"],
        "Country": "Australia",
        "Notes": properties['AAC'],
    })

# Extract href data from HTML
links_data = extract_links_from_file(html_file)

# Merge parsed data with extracted hrefs
merged_data = merge_location_data_with_links(location_data, links_data)

# Save parsed data to a new JSON file
with open(output_json_file, "w", encoding="utf-8") as outfile:
    json.dump(merged_data, outfile, indent=4)

# print("Parsed data saved to", output_json_file)
