'''
get URLs for wave buoys in Queensland
'''

# input
url = 'https://www.qld.gov.au/environment/coasts-waterways/beach/monitoring/waves-sites'

# packages
import requests
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

# Function to scrape and parse location data
def scrape_locations(url):
    response = requests.get(url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.text, 'html.parser')
        script_tag = soup.find('script', string=re.compile(r'var location_list = \[\]'))
        
        if script_tag:
            script_content = script_tag.string
            
            # Regex pattern to extract locations from JavaScript array
            pattern = r"\['([^']+)',\s*(-?\d+\.\d+),\s*(-?\d+\.\d+),\s*'([^']+)'\]"
            matches = re.findall(pattern, script_content)
            
            # Convert matches into structured dictionary
            locations = [
                {
                    'DataType': 'Wave Buoy',
                    'Name': match[0],
                    'Longitude': float(match[2]),
                    'Latitude': float(match[1]),
                    "URL": 'https://www.qld.gov.au/environment/coasts-waterways/beach/monitoring/waves-sites/'+match[3],
                    "Owner": "Qld Gov",
                    "State": "QLD",
                    "Country": "Australia",
                    "Notes": "",
                }
                for match in matches
            ]
            
            return locations
        else:
            print("Could not find the location list in the JavaScript code.")
    else:
        print(f"Failed to fetch the page. Status code: {response.status_code}")

    return []

# Run the scraper
locations = scrape_locations(url)

# Save to JSON file
json_file = r'data\all_json_files\locations_wave_buoys_qld.json'
if locations:
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(locations, f, indent=4)

    print("Data saved to "+json_file)
else:
    print("No locations found.")

