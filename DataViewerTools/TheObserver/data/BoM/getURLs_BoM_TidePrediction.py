"""
Get Tide Prediction information from BoM

Site files (cf http://www.bom.gov.au/australia/tides/scripts/config.js):
- http://www.bom.gov.au/australia/tides/tide_prediction_sites.json
- http://www.bom.gov.au/australia/tides/tide_stream_prediction_sites.json
"""

# Inputs
json_sourcefile = r'data\BoM\tide_prediction_sites.json'
output_json_file = r'data\BoM\locations_tide_predictions.json'

# Package imports
import json
import re

# Load the JSON data from a file
with open(json_sourcefile, "r", encoding="utf-8") as file:
    data = json.load(file)

# Extract relevant fields
parsed_data = []
for feature in data["features"]:
    properties = feature["properties"]

    # Extract and format state from AAC
    state_code = properties["AAC"].split('_')[0]
    state = "offshore" if state_code == "INT" else state_code.lower()

    # Format port name: lowercase, remove brackets, replace spaces with hyphens
    port_name = re.sub(r"[()\s]+", "-", properties["PORT_NAME"].lower()).strip("-")

    # Construct URL
    url = f"http://www.bom.gov.au/australia/tides/#!/{state}-{port_name}"

    parsed_data.append({
        "DataType": "Tide Prediction",
        "Name": properties["PORT_NAME"],
        "Longitude": properties["LON"],
        "Latitude": properties["LAT"],
        "URL": url,
        "Owner": "BoM",
        "State": state_code,
        "Country": "Australia",
        "Notes": f"{properties['AAC']}, {properties['ALT_REF']}"
    })

# Save parsed data to a new JSON file
with open(output_json_file, "w", encoding="utf-8") as outfile:
    json.dump(parsed_data, outfile, indent=4)

print("Parsed data saved to", output_json_file)
