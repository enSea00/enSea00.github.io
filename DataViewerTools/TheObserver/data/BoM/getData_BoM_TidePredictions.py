from bs4 import BeautifulSoup
import requests
import json
import os
import time
import math
import re

# Load your JSON file with URLs
json_file_path = r'data\all_json_files\locations_tide_predictions.json'
output_path = r'data\BoM\tide_predictions'
Ndays = 14 # number of tide prediction days

# load the sites
with open(json_file_path, 'r') as file:
    data = json.load(file)

N = len(data)  # Limit how many locations to parse

# parsing function
def parse_qld_tides(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": url
    }

    response = requests.get(url, headers=headers)
    if response.status_code != 200:
        raise Exception(f"Failed to fetch URL: {url} (Status code: {response.status_code})")

    soup = BeautifulSoup(response.text, "html.parser")
    tide_days = soup.select(".tide-day")
    parsed_data = []

    for day in tide_days:
        date = day.find("h3").text.strip()
        rows = day.find_all("tr")
        entries = []

        for i in range(0, len(rows), 2):
            try:
                type_cell = rows[i].find("th")
                time_cell = rows[i].find("td")
                height_cell = rows[i + 1].find("td")

                if not type_cell or not time_cell or not height_cell:
                    continue  # skip blank or malformed entries

                tide_type = type_cell.text.strip().lower()
                time_local = time_cell.get("data-time-local", "").strip()
                time_utc = time_cell.get("data-time-utc", "").strip()
                time_str = time_cell.text.strip()
                height = height_cell.text.strip()

                entries.append({
                    "type": tide_type,
                    "time_local": time_local,
                    "time_utc": time_utc,
                    "time_str": time_str,
                    "height_m": height
                })
            except Exception as e:
                print(f"Skipping row due to error: {e}")

        parsed_data.append({
            "date": date,
            "entries": entries
        })

    return parsed_data

# iterate over stations
start_time = time.time()
for ii in range(min(N, len(data))):
    name = data[ii]["Name"]
    aac = data[ii]["Notes"]
    url = f'http://www.bom.gov.au/australia/tides/print.php?aac={aac}&type=tide&days={Ndays}'
    print(f"Fetching site {ii+1} of {len(data)} ({name}, {aac})")

    try:
        tide_data = parse_qld_tides(url)

        # Add site_info to the output
        output_json = {
            "site_info": {
                "name": name,
                "aac": aac
            },
            "tide_predictions": tide_data
        }

        # Write to JSON file
        output_file = os.path.join(output_path, f'{aac}.json')
        with open(output_file, 'w', encoding='utf-8') as out_file:
            json.dump(output_json, out_file, indent=2)

        # print(f"Saved to {output_file}")
    except Exception as e:
        print(f"Error fetching data for {name} ({aac}): {e}")

elapsed = time.time() - start_time
print(f"\nFinished in {elapsed:.2f} seconds.")