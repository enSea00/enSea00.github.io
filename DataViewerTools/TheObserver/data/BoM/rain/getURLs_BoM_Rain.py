'''

'''

csv_file = r'data\BoM\rain\bom_rain_gauges_updated.csv'

import pandas as pd
import json 

df = pd.read_csv(csv_file)
df.drop(df[df['agency'] == 'Private owner'].index, inplace=True) # drop the private owner gauges which have no url
# ['bom_stn_num', 'name', 'lat', 'long', 'state', 'location_types',
#        'forecast_site_classification', 'basin', 'agency', 'featreal',
#        'objectid', 'URL']

# rename columns
df.columns = ['Notes', 'Name', 'Latitude', 'Longitude', 'State', 'location_types',
       'forecast_site_classification', 'basin', 'Owner', 'featreal',
       'objectid', 'URL']

# drop unwanted columns
df.drop(columns=['location_types','forecast_site_classification', 'basin', 'featreal','objectid', ], inplace=True)

# add required columns
df['DataType'] = 'Rain Gauge'
df['Country'] = 'Australia'
df["State"] = df["State"].str.upper()

# reorder columns
df = df[['DataType', 'Name', 'Longitude', 'Latitude', 'URL','Owner','State','Country','Notes']]
df = df.dropna()

# correct url syntax
df["URL"] = df["URL"].apply(lambda x: x.encode("utf-8").decode("unicode_escape"))

# df.to_json(r'data\all_json_files\locations_rain_bom.json', orient="records", indent=4)
# Convert DataFrame to JSON string without escaping forward slashes
json_output = df.to_json(orient="records")

# Save JSON with proper encoding (preventing unwanted escapes)
with open(r'data\all_json_files\locations_rain_bom.json', "w", encoding="utf-8") as f:
    json.dump(json.loads(json_output), f, indent=4, ensure_ascii=False)

print("JSON saved successfully without incorrect escapes.")
