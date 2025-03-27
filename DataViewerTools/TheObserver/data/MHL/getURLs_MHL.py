'''
parse urls from MHL website api

api = r'https://api.manly.hydraulics.works/api.php?username=publicwww&token=Ujc3MzU0ZktTbTR4dEJGUmZ4aFgvMHhLeW02cS90amwvSW4vYzJrZVdhZG1oTlFuNTcvQlpBQTBLMTNSU0NiaVZ4TEh6bVJsSmZVZHJwTENMeTFWSnBMeFZmYlZ0M3lWaFhsSjlvZFViRS9FWm9iSUxtcU1WQ0JNZWF2VEExeHFCVWpucmlucTIvQTBEQitzdXp6Yk8rc2RIZE0rbmExSk9YN1VkTjlTa1JXVVVkRUZjVjV4ZWh1dW9GY2UzSVlsODRjRHU5dDExc1NsL3hyNkVaYk5YbUdpeDlBZklVNVJaay9LQmVmTlJncFlObnhobENKOE94NVh4d1daamN3ckpaWlU1aTcwcjV3UnhxRmpldERZb2c9PQ%3D%3D'

I found the api via Inspect -> Network

'''

# input
characteristic_values = ["wave", "oceantide", "rain", "level"]
input_file = r'data/MHL/mhl_api.json'
output_file = r'data/all_json_files/locations_mhl_all.json'

# packages
import json

def filter_json_by_characteristic(input_json, characteristic_values):
    """
    Filters the input JSON based on a list of user-specified characteristic values.
    It keeps the fields: name, sitecode, latitude, longitude for each feature.

    :param input_json: The JSON data (already loaded from a file)
    :param characteristic_values: A list of characteristic values to filter by
    :return: A filtered list of features in JSON format
    """
    filtered_features = []

    # Loop through each feature in the input JSON
    for feature in input_json.get("features", []):
        characteristic = feature.get("properties", {}).get("characteristic", "")
        
        # If the characteristic matches the user's specified list, keep the feature
        if characteristic in characteristic_values:
            # Prepare a new filtered feature with only the necessary fields
            url = f'https://mhl.nsw.gov.au/Station-{feature.get("properties", {}).get("sitecode")}'
            
            if characteristic == "wave":
                data_type = "Wave Buoy"
            elif characteristic == "oceantide":
                data_type = "Tide Gauge"
            elif characteristic == "rain":
                data_type = "Rain Gauge"
            elif characteristic == "level":
                data_type = "River Gauge"


            filtered_feature = {
                "DataType": data_type,
                "Name": feature.get("properties", {}).get("name"),
                "Longitude": float(feature.get("properties", {}).get("longitude")),
                "Latitude": float(feature.get("properties", {}).get("latitude")),
                "URL": url,
                "Owner": "MHL", #feature.get("properties", {}).get("ownership"),
                "State": "NSW",
                "Country": "Australia",
                "Notes": "Source "+feature.get("properties", {}).get("ownership")
            }
            filtered_features.append(filtered_feature)

    # Return the filtered JSON with the selected features
    return filtered_features

def save_json_to_file(filtered_json, output_file):
    """
    Saves the filtered JSON data to a specified file.

    :param filtered_json: The filtered JSON data
    :param output_file: Path to the output file
    """
    with open(output_file, 'w', encoding='utf-8') as file:
        json.dump(filtered_json, file, indent=4)
    print(f"Filtered JSON has been saved to {output_file}")

def load_json_from_file(input_file):
    """
    Loads JSON data from a file.

    :param input_file: Path to the input JSON file
    :return: Loaded JSON data
    """
    with open(input_file, 'r', encoding='utf-8') as file:
        return json.load(file)

# Example usage:

# Load JSON data from the file
input_json = load_json_from_file(input_file)

# Specify the characteristic values to filter by

# Filter the JSON based on the characteristics
filtered_json = filter_json_by_characteristic(input_json, characteristic_values)

# Save the filtered JSON to the file
save_json_to_file(filtered_json, output_file)
