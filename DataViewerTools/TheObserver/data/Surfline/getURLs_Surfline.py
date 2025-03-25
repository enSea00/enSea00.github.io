'''
Get URLs from surfline.com

Manually copy the underlyting json data as follows:
the rootUURL is found via "https://www.surfline.com/surf-reports-forecasts-cams-map", right click ->Inspect -> Network and then find the "mapview" request and copy URL. Then modify the bbox coords for entire gloe
rootURL = https://services.surfline.com/kbyg/mapview?south=-80.0&west=-180.0&north=80.0&east=180.0&accesstoken=e3357e2d7ab5f3f54b8a8865361b3a39e318bd0b
go to root url and then copy and paste the json data into a file, eg surfline_json.json for ythe json_file variable below.

'''

# input

# json data manually copied from - url = r'https://services.surfline.com/kbyg/mapview?south=-80.0&west=-180.0&north=80.0&east=180.0&accesstoken=e3357e2d7ab5f3f54b8a8865361b3a39e318bd0b'
json_file = 'data\Surfline\surfline_json.json'
 
# packages
import json
import re

# functions
def format_name(sname):
    # Replace spaces and underscores with hyphens
    formatted = re.sub(r'[\s_]+', '-', sname.strip())
    # Convert to lowercase
    return formatted.lower()

# Load the JSON file
with open(json_file, 'r', encoding='utf-8') as file:
    data = json.load(file)

# Access the 'spots' list from the 'data' key
spots = data.get('data', {}).get('spots', [])

# Print the spots information
locations = []
for spot in spots:

    slug = format_name(spot["name"])

    # Check if the spot has cameras
    if not spot["cameras"]:
        data_type = "Surfline (No Cam)"
        url = f'https://www.surfline.com/surf-report/{slug}/{spot["_id"]}'
    else:
        data_type = "Surfline (Cam)"
        url = f'https://www.surfline.com/surf-report/{slug}/{spot["_id"]}?camId={spot["cameras"][0]["_id"]}'
    
    # Create a dictionary for the location
    data = {
        "DataType": data_type,
        "Name": spot["name"],
        "Longitude": spot["lon"],
        "Latitude": spot["lat"],
        "URL": url,
        "Owner": "Surfline",
        "State": spot["subregion"]["name"],
        "Country": spot["timezone"],
        "Notes": "",
    }
    locations.append(data)

# Save the locations to a JSON file
json_file = r'data\all_json_files\locations_surfline.json'
with open(json_file, 'w', encoding='utf-8') as file:
    json.dump(locations, file, indent=4)

print(f"Data saved to {json_file}") 

