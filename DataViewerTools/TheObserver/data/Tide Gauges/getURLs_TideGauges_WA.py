'''
get WA tide gauge URLs

1. Go to https://www.transport.wa.gov.au/imarine/tide-data-real-time.asp
2. Inspect -> Network -> data?f=json
3. Found "url": "https://services6.arcgis.com/67Ks15nDmWoIbK8b/arcgis/rest/services/TIDES_LIVE_STATIONS_ldot/FeatureServer/",
4. Use QGIS to connect to the url above
5. Export as csv from QGIS
6. Run script below 


other WA gov featurelayers - https://services6.arcgis.com/67Ks15nDmWoIbK8b/ArcGIS/rest/services

'''

csv_file_path = r'data\Tide Gauges\wa_tides_ldot.csv'
json_file_path = r'data\all_json_files\locations_tide_gauges_wa.json'


# Define the column mapping (original column names -> new column names)
column_mapping = {
    'STATION_NAME': 'Name',
    'LONGITUDE': 'Longitude',
    'LATITUDE': 'Latitude',
    'LIVE_STORM_SURGE': 'URL',
    'LOCATION_ID': 'Notes',
}

import csv
import json
import re

import csv
import json
import re

def clean_lat_lon(lat_lon_str):
    """
    Clean the lat/lon string by removing the CRS part (e.g., "(GDA2020)") 
    and returning the numeric value as a float.
    """
    # Remove the CRS part (text within parentheses at the end of the string)
    cleaned_str = re.sub(r"\s?\(.*\)$", "", lat_lon_str)
    
    # Try converting to float after cleaning
    try:
        return float(cleaned_str)
    except ValueError:
        return None  # Return None if conversion fails

def csv_to_json_with_column_mapping(csv_file_path, json_file_path, column_mapping):
    data = []
    
    # Generate selected_columns dynamically based on the keys of column_mapping
    selected_columns = list(column_mapping.keys())
    
    # Open the CSV file for reading
    with open(csv_file_path, mode='r', encoding='utf-8') as csv_file:
        # Create a CSV reader object
        csv_reader = csv.DictReader(csv_file)

        # Iterate over each row and add only selected columns to the data list
        for row in csv_reader:
            filtered_row = {'DataType': 'Tide Gauge'}
            
            # Filter row based on selected columns and map to new names
            for col in selected_columns:
                if col in row:
                    # Get the new column name from the mapping
                    new_col_name = column_mapping.get(col, col)  # Default to original name if no mapping found
                    filtered_row[new_col_name] = row[col]
            
            # Clean latitude and longitude data if they exist and are selected
            if 'Latitude' in filtered_row:
                filtered_row['Latitude'] = clean_lat_lon(filtered_row['Latitude'])
            if 'Longitude' in filtered_row:
                filtered_row['Longitude'] = clean_lat_lon(filtered_row['Longitude'])

            filtered_row['Owner'] = 'WA Government'
            filtered_row['State'] = 'WA'
            filtered_row['Country'] = 'Australia'

            data.append(filtered_row)
    
    # Write the filtered JSON data to the output file
    with open(json_file_path, 'w', encoding='utf-8') as json_file:
        json.dump(data, json_file, indent=4)

    print(f"CSV data has been successfully converted to JSON with selected columns and new names, saved to {json_file_path}")

csv_to_json_with_column_mapping(csv_file_path, json_file_path, column_mapping)





