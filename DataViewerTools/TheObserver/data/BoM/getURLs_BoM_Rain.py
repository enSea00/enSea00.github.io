'''
1. Gauge location data obtained via the BoMs ArcGIS REST Server :: https://hosting.wsapi.cloud.bom.gov.au/arcgis/rest/services/flood/National_Flood_Gauge_Network/MapServer
ie connect using QGIS and then export "rain gauge" to csv and modify as required
'''

# input
import requests
import csv
from bs4 import BeautifulSoup

# Input parameters
location_csv = r'data\BoM\bom_rain_gauges.csv'
states = ['qld', 'nsw', 'sa', 'vic', 'nt', 'tas', 'wa']
interval = '1hr'  # Can be '1hr', '3hr', or '24hr'

# Headers to mimic a real browser request
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

# Function to scrape the rainfall data URLs
def get_rainfall_urls(state, interval):
    url_state = f'http://www.bom.gov.au/{state}/flood/rain_river.shtml'
    
    # Send GET request with headers
    response = requests.get(url_state, headers=headers)
    
    if response.status_code != 200:
        print(f"Failed to fetch data for {state}: {response.status_code}")
        return []

    soup = BeautifulSoup(response.text, 'html.parser')
    
    extracted_urls = []
    
    # Find the rainfall data table
    table = soup.find('table', class_='table-text')
    if not table:
        print(f"No table found for {state}")
        return []

    for row in table.find_all('tr')[1:]:  # Skip header row
        cols = row.find_all('td')
        if len(cols) >= 4:  # Ensure it has expected structure
            river_basin = cols[0].text.strip()
            interval_map = {'1hr': 1, '3hr': 2, '24hr': 3}
            if interval in interval_map:
                link = cols[interval_map[interval]].find('a')
                print(link)
                if link and 'href' in link.attrs:
                    full_url = f"http://www.bom.gov.au{link['href']}"
                    extracted_urls.append([state, river_basin, interval, full_url])
    
    return extracted_urls

# Store all extracted URLs
all_data = [["State", "River Basin", "Interval", "URL"]]  # CSV header

for state in states:
    print(f'Processing {state} ...')
    state_data = get_rainfall_urls(state, interval)
    all_data.extend(state_data)

# Save to CSV
output_csv = r'data\BoM\extracted_rainfall_urls.csv'
with open(output_csv, 'w', newline='', encoding='utf-8') as file:
    writer = csv.writer(file)
    writer.writerows(all_data)

print(f"Scraped data saved to {output_csv}")


# do the merging
import pandas as pd
import requests
from bs4 import BeautifulSoup
from fuzzywuzzy import fuzz, process
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import signal

# --- CONFIGURATION ---
gauges_file = r"data\BoM\bom_rain_gauges.csv"
urls_file = r"data\BoM\extracted_rainfall_urls.csv"
output_file = r"data\BoM\bom_rain_gauges_updated.csv"
match_threshold = 80  # Adjust as needed
max_workers = 10  # Number of parallel threads

# --- LOAD DATA ---
gauge_data = pd.read_csv(gauges_file)
rainfall_urls = pd.read_csv(urls_file)

# Convert state column to lowercase for case-insensitive comparison
gauge_data["state"] = gauge_data["state"].str.lower()
rainfall_urls["State"] = rainfall_urls["State"].str.lower()

# --- FUNCTION TO SCRAPE PAGE AND MATCH GAUGES ---
def process_url(row):
    """Fetch page, extract station names, match within the same state."""
    state, river_basin, interval, url = row["State"], row["River Basin"], row["Interval"], row["URL"]
    print(f'{state} {river_basin} {url}')
    headers = {"User-Agent": "Mozilla/5.0"}

    # Filter gauges to only those in the same state (case-insensitive)
    state_gauges = gauge_data[gauge_data["state"] == state]
    gauge_names = state_gauges["name"].tolist()  # Only names from the same state

    try:
        response = requests.get(url, headers=headers, timeout=10)  # Set a timeout for the request
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")

        # Extract station names (handling &nbsp issue)
        station_names = [
            tag.get_text(separator=" ").strip().replace("\xa0", " ")
            for tag in soup.find_all("td") if tag.get_text(strip=True)
        ]

        matched_entries = []
        for station in station_names:
            
            best_match, score = process.extractOne(station, gauge_names, scorer=fuzz.partial_ratio) or (None, 0)
            if best_match and score >= match_threshold:
                print(state, best_match, url)
                matched_entries.append((best_match, url))
        
        return matched_entries  # List of (gauge_name, url) pairs

    except requests.exceptions.RequestException as e:
        print(f"⚠️ Error fetching {url}: {e}")
        return []

# --- PARALLEL PROCESSING WITH TIMEOUT HANDLING ---
updates = []

def handle_interrupt(signal, frame):
    print("\nProcess interrupted by user.")
    exit(0)

signal.signal(signal.SIGINT, handle_interrupt)  # Handle Ctrl-C interrupt

with ThreadPoolExecutor(max_workers=max_workers) as executor:
    try:
        results = executor.map(process_url, rainfall_urls.to_dict(orient="records"))
        for matched in results:
            updates.extend(matched)
    except TimeoutError:
        print("⚠️ Timeout error occurred during URL processing.")
    except Exception as e:
        print(f"⚠️ An unexpected error occurred: {e}")

# --- BULK UPDATE ---
update_dict = dict(updates)  # Convert to dictionary for fast mapping
gauge_data["URL"] = gauge_data["name"].map(update_dict)

# --- SAVE UPDATED CSV ---
gauge_data.to_csv(output_file, index=False)
print(f"\n✅ Updated CSV saved as {output_file}")









