import requests
from bs4 import BeautifulSoup
import re
import json

# URLs to scrape
url_qld_tide_gauges = 'https://www.qld.gov.au/environment/coasts-waterways/beach/tide-sites'
url_qld_storm_tide_gauges = 'https://www.qld.gov.au/environment/coasts-waterways/beach/storm/storm-sites'
json_file = r'data\Tide Gauges\locations_tide_gauges_qld.json'
# Function to scrape and parse data
def scrape_and_parse_data(url):
    response = requests.get(url)
    
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, 'html.parser')
        script_tag = soup.find('script', string=re.compile('location_list ='))
        
        if script_tag:
            script_content = script_tag.string
            pattern = r"\[\'([^\']+)\',\s*(-?\d+\.\d+),\s*(-?\d+\.\d+),\s*\'([^\']+)\'\]"
            matches = re.findall(pattern, script_content)
            
            locations = [
                {
                    'DataType': 'Tide Gauge',
                    'Name': match[0],
                    'Latitude': float(match[1]),
                    'Longitude': float(match[2]),
                    'URL': url + f'/{match[3]}',
                    'Owner': 'QLD Government',
                    'State': 'QLD',
                    'Country': 'Australia',
                    'Notes': ''
                }
                for match in matches
            ]
            
            return locations
        else:
            print("Could not find the script with the location data.")
    else:
        print(f"Failed to fetch the page. Status code: {response.status_code}")

    return []

# Scrape both URLs
locations = scrape_and_parse_data(url_qld_tide_gauges) + scrape_and_parse_data(url_qld_storm_tide_gauges)

# Save to JSON file
if locations:
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(locations, f, indent=4)

    print("Data saved to "+json_file)
