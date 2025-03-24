'''
Script to web scrape the BoM website for the URLs of the weather stations
nc, mar, 2025
'''

# Inputs ########################################
list_of_states = ['nsw', 'vic', 'qld', 'sa', 'wa', 'tas', 'nt'] # act is under nsw
bom_product_id = '60801' # a href search term

# Packages ########################################
from bs4 import BeautifulSoup
import requests
import re 
import json
import os

# Functions ########################################
def extract_links(html_content,bom_product_id):
    # Parse the HTML content
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find all <a> tags and filter those containing '60801' in the href attribute
    links = [a['href'] for a in soup.find_all('a', href=True) if bom_product_id in a['href']]
    
    return links

def get_html_content(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }

    try:
        # Send a GET request to the URL with custom headers
        response = requests.get(url, headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            return response.text
        else:
            return f"Error: Unable to fetch the page. Status code: {response.status_code}"
    
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"


        # "DataType": "River Gauge",
        # "Name": "BILLINUDGEL",
        # "Longitude": 153.5268,
        # "Latitude": -28.5016,
        # "URL": "http://www.bom.gov.au/fwo/IDN60231/IDN60231.558020.plt.shtml",
        # "Owner": "BoM",
        # "State": "NSW",
        # "Country": "Australia",
        # "Notes": "558020"

def parse_station_details(html_content):
    # Parse the HTML content with BeautifulSoup
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Find the table with class 'stationdetails'
    station_table = soup.find('table', class_='stationdetails')
    
    # Initialize a dictionary to store the parsed details
    # DataType,Name,Longitude,Latitude,URL,Owner,State,Country,Notes

    station_details = {}
    station_details['DataType'] = 'Weather Station'
    station_details['Owner'] = 'BoM'
    station_details['Country'] = 'Australia'
    station_details['Notes'] = ''

    if station_table:
        # Find all the <td> elements in the table
        tds = station_table.find_all('td')

        # Extract the relevant information
        for td in tds:
            # Strip any unnecessary whitespaces and process each <td>
            text = td.get_text(strip=True)
            if 'ID:' in text:
                station_details['Notes'] = 'Station ' + text.replace('ID:', '').strip()
            elif 'Name:' in text:
                station_details['Name'] = text.replace('Name:', '').strip()
            elif 'Lat:' in text:
                station_details['Latitude'] = text.replace('Lat:', '').strip()
            elif 'Lon:' in text:
                station_details['Longitude'] = text.replace('Lon:', '').strip()
            # elif 'Height:' in text:
            #     station_details['Height'] = text.replace('Height:', '').strip()

    return station_details

def get_state_from_url(url):
    match = re.search(r'ID([A-Z])60801', url)
    if not match:
        return None  # Return None if no match is found

    state_letter = match.group(1)  # Extract the letter after "ID"
    
    state_mapping = {
        'N': 'NSW',
        'V': 'VIC',
        'Q': 'QLD',
        'S': 'SA',
        'W': 'WA',
        'T': 'TAS',
        'D': 'NT'
    }
    
    return state_mapping.get(state_letter, None)  # Return state name or None if letter is unknown

# Processing ########################################

# Get all AWS links
all_links = []
for state in list_of_states:
    url = 'http://www.bom.gov.au/'+state+'/observations/'+state+'all.shtml'
    # print(url_strutcture)
    html_content = get_html_content(url)
    links = extract_links(html_content, bom_product_id)
    all_links.extend(links)

# Prepend the base URL to each link in all_links
all_links = ['http://www.bom.gov.au' + link if not link.startswith("http") else link for link in all_links]

# Output file
output_file = "locations_aws.json"
all_station_details = []  # List to store all station data

for ii,url in enumerate(all_links):
    print('  Processing station', ii+1, 'of', len(all_links))
    html_content = get_html_content(url)
    station_details = parse_station_details(html_content)
    station_details["URL"] = url
    station_details["State"] = get_state_from_url(url)

    # Reorder the dictionary
    ordered_keys = ['DataType', 'Name', 'Longitude', 'Latitude', 'URL', 'Owner', 'State', 'Country', 'Notes']
    ordered_dict = {key: station_details[key] for key in ordered_keys}

    # Append to master
    all_station_details.append(station_details)  # Store data in memory

# Write all collected data to JSON file at once
script_dir = os.path.dirname(os.path.abspath(__file__))
json_file_path = os.path.join(script_dir, "locations_aws.json")

# Save to JSON file
with open(json_file_path, "w", encoding="utf-8") as json_file:
    json.dump(all_station_details, json_file, indent=4)

print(f"Saved {len(all_station_details)} station records to {json_file_path}")

# End ########################################
