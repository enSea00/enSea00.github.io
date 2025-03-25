'''
getURLs_Swellnet.py
This script is used to scrape the URLs of the surf reports from Swellnet.

root url for json data https://www.swellnet.com/sitemap.json?v=1742859776240 - does not contain lat loninfo - need to manually find!!!

'''


import csv
import json

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
extract_rows_by_datatype("urls_points.csv", r"data\all_json_files\locations_swellnet.json", "Swellnet (Cam)")
