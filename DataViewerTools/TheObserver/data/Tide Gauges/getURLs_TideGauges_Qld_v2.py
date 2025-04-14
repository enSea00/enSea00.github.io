import requests
from bs4 import BeautifulSoup
import re
import json
import pandas as pd
from rapidfuzz import process, fuzz

# Input URLs and file paths
url_qld_tide_gauges = 'https://www.qld.gov.au/environment/coasts-waterways/beach/tide-sites'
url_qld_storm_tide_gauges = 'https://www.qld.gov.au/environment/coasts-waterways/beach/storm/storm-sites'
json_file = r'data\all_json_files\locations_tide_gauges_qld.json'

# CSV URLs
csv1_url = 'https://apps.des.qld.gov.au/data-sets/storm-tides/tide-7dayopdata.csv'
csv2_url = 'https://apps.des.qld.gov.au/data-sets/storm-tides/stdtide-7dayopdata.csv'

# Mapping of web display names to CSV site names
matched_mapping = {
    "Abell Point Marina": "abellpoint", "Banana Bank": "bananabank", "Birkdale": "birkdale",
    "Boigu Island": "boigu", "Boigu Jetty": "", "Bowen": "bowen", "Bundaberg Port": "bundaberg",
    "Burketown": "burketown", "Burnett Heads": "burnett", "Cairns": "cairns",
    "Cape Ferguson": "capeferg", "Cardwell": "cardwell", "Clump Point": "clumppoint",
    "Cooktown": "cooktown", "Coombabah Lake South": "coombabahst", "Dalrymple Bay": "dalbay",
    "Gold Coast Seaway": "gcseaway", "Gold Coast": "goldcoast", "Golden Beach": "goldenbeach",
    "Halls Bay": "hallsbay", "Hussey Creek": "husseycreek", "Iama Island": "iama",
    "Karumba": "karumba", "Moa Island (Kubin)": "kubin", "Lucinda": "lucinda",
    "Lucinda Inshore": "", "Mackay": "mackaynew", "Maroochydore": "maroochydore",
    "Mooloolaba": "mooloolaba", "Mornington Island": "morningtonA", "Mossman": "mossman",
    "Mourilyan": "mourilyan", "Noosa River Sand Jetty": "noosasandstg", "Palm Cove": "palmcove",
    "Port Alma": "portalma", "Port Douglas": "portdouglas", "Raby Bay": "rabybay",
    "Rosslyn Bay": "rosslyn", "Russell Island East": "russellislande", "Russell Island West": "russellislandw",
    "Scarborough": "scarborough", "Seaforth": "seaforth", "Shorncliffe": "shorncliffe",
    "South Trees Island (Gladstone)": "southtrees", "Moa Island (St Pauls)": "stpauls",
    "Tangalooma": "tangalooma", "The Skids": "theskids", "Thursday Island": "thursdayisland",
    "Townsville": "townsville", "Townsville Cardinal Beacon": "townsvillecard",
    "Tweed Sand Bypass Jetty": "tweedsbj", "Ugar Island": "ugar", "Urangan": "urangan",
    "Warraber": "warraber", "Wave Break Island North": "wavebreaknc",
    "Wave Break Island West": "wavebreakwc", "Weipa": "weipanx", "Brisbane Bar": "whyteislandnx",
    "Brisbane River": "", "Donnybrook": "", "Noosa River - Munna point": "",
    "Noosa River - Tewantin": "", "Tin Can Bay": ""
}

# Scrape tide gauge locations
def scrape_locations(url):
    gauge_type = url.split('/')[-1].split('-')[0]
    response = requests.get(url)
    if response.status_code != 200:
        print(f"❌ Failed to fetch {url}")
        return []

    soup = BeautifulSoup(response.content, 'html.parser')
    script = soup.find('script', string=re.compile('location_list ='))
    if not script:
        print(f"⚠️ Script tag not found in {url}")
        return []

    pattern = r"\['([^']+)',\s*(-?\d+\.\d+),\s*(-?\d+\.\d+),\s*'([^']+)'\]"
    matches = re.findall(pattern, script.string)
    
    return [
        {
            'DataType': 'Tide Gauge',
            'Name': name,
            'Latitude': float(lat),
            'Longitude': float(lon),
            'URL': f"{url}/{link}",
            'Owner': 'Qld Gov',
            'State': 'QLD',
            'Country': 'Australia',
            'Notes': gauge_type
        }
        for name, lat, lon, link in matches
    ]

# Combine scraped locations
locations = scrape_locations(url_qld_tide_gauges) + scrape_locations(url_qld_storm_tide_gauges)

# Load CSV site names
def get_all_sites():
    df1 = pd.read_csv(csv1_url, skiprows=1)
    df2 = pd.read_csv(csv2_url, skiprows=1)
    df1.columns = df1.columns.str.strip()
    df2.columns = df2.columns.str.strip()
    return sorted(set(df1['Site'].dropna()).union(df2['Site'].dropna())), df1, df2

all_sites, df1, df2 = get_all_sites()

# Create fuzzy matching helpers
cleaned_loc_names = [(loc['Name'].lower().replace(" ", ""), i) for i, loc in enumerate(locations)]
unmatched_sites = []
MATCH_THRESHOLD = 75

# Fuzzy match CSV sites → scraped web names
for site in all_sites:
    site_clean = site.lower().replace(" ", "")
    match = process.extractOne(site_clean, [n for n, _ in cleaned_loc_names], scorer=fuzz.partial_ratio)
    if match and match[1] >= MATCH_THRESHOLD:
        matched_index = cleaned_loc_names[match[2]][1]
        note = locations[matched_index].get('Notes', '')
        locations[matched_index]['Notes'] = f"{note.strip()} | {site}".strip(" |")
    else:
        unmatched_sites.append(site)

# Add unmatched CSV sites as new entries
for site in unmatched_sites:
    source, df = (csv1_url, df1) if site in df1['Site'].values else (csv2_url, df2) if site in df2['Site'].values else (None, None)
    if source:
        row = df[df['Site'] == site].iloc[0]
        try:
            locations.append({
                'DataType': 'Tide Gauge',
                'Name': site,
                'Latitude': float(row['Latitude']),
                'Longitude': float(row['Longitude']),
                'URL': source,
                'Owner': 'Qld Gov',
                'State': 'QLD',
                'Country': 'Australia',
                'Notes': ''
            })
        except Exception as e:
            print(f"⚠️ Failed to add {site}: {e}")
    else:
        print(f"⚠️ {site} not found in either dataset")

# Inverse mapping to backfill empty Notes
inverse_mapping = {v.lower(): k for k, v in matched_mapping.items() if v}
for loc in locations:
    name, notes = loc['Name'], loc.get('Notes', '')

    if notes == "":
        site_key = name.lower().replace(" ", "")
        if site_key in inverse_mapping:
            loc['Name'] = inverse_mapping[site_key]
            loc['Notes'] = site_key
            print(f"🔄 Inverse map applied: Name='{loc['Name']}', Notes='{loc['Notes']}'")
        continue

    expected_site = matched_mapping.get(name)
    if expected_site is None:
        continue
    if expected_site == "":
        if '|' in notes:
            loc['Notes'] = notes.split('|')[0].strip()
            print(f"❌ {name}: removed CSV ref from Notes")
        continue

    if '|' in notes:
        base, match_site = map(str.strip, notes.split('|', 1))
        if match_site.lower().replace(" ", "") != expected_site.lower():
            loc['Notes'] = f"{base} | {expected_site}"
            print(f"⚠️ {name}: corrected Notes to '{loc['Notes']}'")
    else:
        loc['Notes'] = f"{notes.strip()} | {expected_site}"
        print(f"➕ {name}: added CSV site to Notes")

# Save final result
with open(json_file, "w", encoding="utf-8") as f:
    json.dump(locations, f, indent=4)
    print(f"✅ Data saved to {json_file}")
