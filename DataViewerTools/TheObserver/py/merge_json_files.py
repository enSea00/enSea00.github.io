# '''
# Merge all location JSON files into one JavaScript file which is loaded by TheObserver.html
# Ensure Longitude and Latitude are floats and remove invalid locations.
# '''

# Packages
import os
import json

# Inputs
json_file_folder = r'data\all_json_files'
js_file = r'js/locations_all.js'

def merge_json_to_js_and_print_unique_datatypes(input_folder, output_file):
    merged_data = []
    unique_datatypes = set()  # Use a set to store unique DataType values
    seen_entries = set()  # To track unique (Name, Longitude, Latitude) tuples

    # Loop through all JSON files in the folder
    for filename in os.listdir(input_folder):
        if filename.endswith(".json"):  # Process only JSON files
            file_path = os.path.join(input_folder, filename)

            try:
                with open(file_path, 'r', encoding='utf-8') as json_file:
                    data = json.load(json_file)

                    # Ensure data is a list
                    if not isinstance(data, list):
                        data = [data]

                    for entry in data:
                        if isinstance(entry, dict):
                            # Convert Longitude and Latitude to float if they exist
                            try:
                                entry["Longitude"] = float(entry["Longitude"])
                                if entry["Longitude"] < 0:
                                    entry["Longitude"] += 360
                                entry["Latitude"] = float(entry["Latitude"])
                            except (ValueError, TypeError, KeyError):
                                continue  # Skip this entry if conversion fails

                            # Generate a unique key based on Name, Longitude, and Latitude
                            unique_key = (entry.get("Name", "").lower(), entry["Longitude"], entry["Latitude"])
                            
                            if unique_key in seen_entries:
                                continue  # Skip duplicates

                            seen_entries.add(unique_key)  # Add to seen set

                            # Collect unique DataType values
                            if "DataType" in entry:
                                unique_datatypes.add(entry["DataType"])

                            merged_data.append(entry)

            except json.JSONDecodeError as e:
                print(f"Error decoding {filename}: {e}")

    # Convert merged data to JavaScript format
    js_content = f"const locations = {json.dumps(merged_data, indent=4)};\n"

    # Write merged data to output JS file
    with open(output_file, 'w', encoding='utf-8') as out_file:
        out_file.write(js_content)

    # Print unique DataType values to the screen
    print("Unique DataTypes:", list(unique_datatypes))
    print(f"Merged {len(merged_data)} unique JSON objects into {output_file}")

# Example usage
merge_json_to_js_and_print_unique_datatypes(json_file_folder, js_file)
