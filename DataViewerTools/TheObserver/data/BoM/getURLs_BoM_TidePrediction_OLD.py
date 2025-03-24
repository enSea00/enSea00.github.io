'''
Get Tide Prediction information from BoM

1. Go to tide prediction home page http://www.bom.gov.au/australia/tides/
2. Right click -> Inspect
3. Click "Elements" tab
4. Search for "div id="location-list""
5. Right click it, copy -> element
6. Paste into empty file and svae, eg bom_tide_prediction.txt
7. run the code below to extract urls and location information  

*** ISSUE - can't get lat, lon automatically????!!!! it is loaded dynamically when marker is clciked and only visible in the elements tab

site files (cf http://www.bom.gov.au/australia/tides/scripts/config.js):
- http://www.bom.gov.au/australia/tides/tide_prediction_sites.json
- http://www.bom.gov.au/australia/tides/tide_stream_prediction_sites.json

'''

# inputs
location_list_element_file = r'data\BoM\bom_tide_div.txt'
output_json_file = r'data\BoM\locations_tide_predictions.json'

# package imports
from bs4 import BeautifulSoup
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


def scrape_ids_names_hrefs(file_path):
    with open(file_path, "r", encoding="utf-8") as file:
        content = file.read()
    
    soup = BeautifulSoup(content, "html.parser")
    locations = []
    
    for a_tag in soup.find_all("a", class_="feature"):
        loc_id = a_tag.get("id")
        loc_name = a_tag.text.strip()
        loc_href = a_tag.get("href")
        state_match = re.match(r"(\w+)_", loc_id) if loc_id else None
        state = state_match.group(1) if state_match else None
        
        if loc_id and loc_name and loc_href:
            locations.append({
                "DataType": "Tide Prediction",
                "Name": loc_name,
                "Longitude": None,
                "Latitude": None,
                "URL": 'http://www.bom.gov.au/australia/tides/' + loc_href,
                "Owner": "BoM",
                "State": state,      
                "Country": "Australia",
                "State": state,
                "Notes": loc_id,
            })
    
    return locations

# Extract locations
locations = scrape_ids_names_hrefs(location_list_element_file)

# Write to a JSON file
with open(output_json_file, 'w', encoding='utf-8') as json_file:
    json.dump(locations, json_file, ensure_ascii=False, indent=4)

print(f"Data saved to {output_json_file}")

