'''
get nsw wave buoy urls

 in pogress - gets urls ok but lat lon are buried inside pdfs on the pages .... ! not many gauges so manual extraction probably easiest

for later - data json url eg https://s3-ap-southeast-2.amazonaws.com/www-data.manly.hydraulics.works/www/stations/wave/BYRBOW.json

'''

# inputs
url = 'https://mhl.nsw.gov.au/Data-Wave'

meta_data = {"Names" : ["BYRBOW","COFHOW","CRHDOW","SYDDOW","PTKMOW","BATBOW","EDENOW"],
             "Longitude" : [153+41/60+41/3600,],
             "Latitude" : [-28-52/60-14/3600, ],
             }
# packages
import requests
import re
import json
from bs4 import BeautifulSoup

#  main functions #############################################################################
def extract_wave_sitecodes(url):
    # Fetch the HTML content
    response = requests.get(url)

    if response.status_code == 200:
        html = response.text

        # Regex to match sitecodes inside case 'Wave':
        pattern = r"case 'Wave':.*?var sitecodes = '(\[.*?\])';"
        match = re.search(pattern, html, re.DOTALL)

        if match:
            sitecodes = json.loads(match.group(1))  # Convert to Python list
            return sitecodes
        else:
            print("No sitecodes found in case 'Wave'.")
            return []

    else:
        print(f"Failed to fetch the page. Status code: {response.status_code}")
        return []

# extract the site names and urls
def get_site_name(url):
    # Send an HTTP request to the URL
    response = requests.get(url)

    # Parse the content of the page
    soup = BeautifulSoup(response.content, 'html.parser')

    # Find the <title> tag and extract its text
    title = soup.find('title').text.strip()

    # Extract the name from the title
    match = re.search(r'MHL\s*:\s*([A-Za-z\s]+)', title)

    if match:
        name = match.group(1)
    else:
        print("Name not found")

    return name

# Run the scraper
sitecodes = extract_wave_sitecodes(url)


# create json structure
locations = []
for sitecode in sitecodes:
    url = 'https://mhl.nsw.gov.au/Station-'+sitecode
    name = get_site_name(url)
    print(f"Name: {name}")
    data = {
            'DataType': 'Wave Buoy',
            'Name': name,
            'Longitude': None,
            'Latitude': None,
            "URL": url,
            "Owner": "NSW Government (MHL)",
            "State": "NSW",
            "Country": "Australia",
            "Notes": "",
        }
    locations.append(data)

# Save to JSON
json_file = r'data\all_json_files\locations_wave_buoys_nsw.json'
if locations:
    with open(json_file, "w", encoding="utf-8") as f:
        json.dump(locations, f, indent=4)
    print("Wave sitecodes saved to "+json_file)
else:
    print("No sitecodes extracted.")

