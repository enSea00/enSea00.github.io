import json
from bs4 import BeautifulSoup
import re
import requests

url_template = 'http://www.bom.gov.au/australia/radar/info/{}_info.shtml'
states = ['nsw', 'qld', 'wa', 'sa', 'nt', 'vic', 'tas']

def get_html(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Connection": "keep-alive"
    }

    try:
        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an exception for HTTP errors
        return response.text
    except requests.RequestException as e:
        print(f"Error fetching {url}: {e}")
        return None


def parse_sites(html, state):
    soup = BeautifulSoup(html, 'html.parser')
    site_infos = []

    # Find all divs with class 'site-info'
    site_divs = soup.find_all('div', class_='site-info')

    for site_div in site_divs:
        site_info = {
            'DataType': 'Rain Radar',
        }

        # Extract name from <h2>
        name_tag = site_div.find('h2')
        if name_tag:
            site_info['Name'] = name_tag.text.strip()

        # Extract latitude and longitude
        location_li = next((li for li in site_div.find_all('li') if 'Location:' in li.get_text()), None)

        if location_li:
            strong_tag = location_li.find('strong')
            if strong_tag:
                loc_text = strong_tag.text
                match = re.search(r'lat\s*([\d.]+)[°&deg;]?\s*S,?\s*long\s*([\d.]+)[°&deg;]?\s*E', loc_text, re.IGNORECASE)
                if match:
                    site_info['Longitude'] = float(match.group(2))   # East is positive
                    site_info['Latitude'] = -float(match.group(1))  # South is negative

        # Extract href
        link_li = site_div.find('li', class_='link')
        if link_li:
            a_tag = link_li.find('a')
            if a_tag and a_tag.get('href'):
                site_info['URL'] = 'http://www.bom.gov.au' + a_tag['href']


        site_info['Owner'] = 'BoM'
        site_info['State'] = state.upper()
        site_info['Country'] = 'Australia'
        site_info['Notes'] = ""

        # Append site info to the list
        site_infos.append(site_info)

    return site_infos


all_radars = []
for state in states:
    print(f"Processing {state.upper()}...")
    url = url_template.format(state)
    html = get_html(url)
    if html:
        site_infos = parse_sites(html, state)
        all_radars.extend(site_infos)  # Flatten the list

# Save to JSON file
output_file = r"data\all_json_files\locations_radar.json"
with open(output_file, "w", encoding="utf-8") as f:
    json.dump(all_radars, f, indent=4)

print(f"Saved {len(all_radars)} radar sites to {output_file}")
