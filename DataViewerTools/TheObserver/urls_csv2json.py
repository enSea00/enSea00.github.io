'''
urls_csv2json.py

extarct DataType subset from old urls_points.csv file and save to new json file

'''

# inputs    
# csv_file = "urls_points.csv"
# DataType = "Swellnet (Cam)"
# json_file = r'data\all_json_files\locations_swellnet.json'

# csv_file = "urls_points.csv"
# DataType = "Web Camera"
# json_file = r'data\all_json_files\locations_cameras.json'

# csv_file = "urls_points.csv"
# DataType = "Willy Weather"
# json_file = r'data\all_json_files\locations_willy.json'

csv_file = "urls_points.csv"
DataType = "Rain Radar"
json_file = r'data\all_json_files\locations_radar.json'

# packages
import csv
import json

# processing
def extract_rows_by_datatype(csv_filename, json_filename, datatype_value):
    filtered_data = []

    # Read CSV file and filter rows
    with open(csv_filename, mode='r', encoding='utf-8') as csv_file:
        reader = csv.DictReader(csv_file)
        for row in reader:
            if row.get("DataType") == datatype_value:
                filtered_data.append(row)

    # Write filtered data to JSON file
    with open(json_filename, mode='w', encoding='utf-8') as json_file:
        json.dump(filtered_data, json_file, indent=4)

    print(f"Extracted {len(filtered_data)} rows with DataType = '{datatype_value}' to {json_filename}")

# Example usage
extract_rows_by_datatype(csv_file, json_file, DataType)
