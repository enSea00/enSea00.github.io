'''
Script to get the URLs of the BoM river guage  stations

challenge: the urls with the plot links do not contain station lat, lon data

'''

# Inputs ########################################

# Rivers by regional pages
# http://www.bom.gov.au/nsw/flood/rain_river.shtml
# http://www.bom.gov.au/wa/flood/rain_river.shtml
# http://www.bom.gov.au/tas/flood/rain_river.shtml

# All state rivers on one page
# http://www.bom.gov.au/cgi-bin/wrap_fwo.pl?IDQ60005.html - qld
# http://www.bom.gov.au/cgi-bin/wrap_fwo.pl?IDV60154.html - vic
# http://www.bom.gov.au/cgi-bin/wrap_fwo.pl?IDS60151.html - sa
# http://www.bom.gov.au/cgi-bin/wrap_fwo.pl?IDD60022.html - nt

# Get info
# 1. Scrape region urls from 
#   http://www.bom.gov.au/STATE/flood/
# 2. Scrape river urls and location info from from the region urls
#   eg http://www.bom.gov.au/qld/flood/seast.shtml looking for <map name= ...> containing  onMouseOver="javascript:PopupRiver" for example
#           <area coords="28,429,32,433" alt="" href="/fwo/IDQ65396/IDQ65396.541050.plt.shtml" onMouseOver="javascript:PopupRiver('MILLBROOK ALERT','	541050','-27.9411','151.7222','5.814','Moderate','Falling','14-03-2025 17:00:00','        4.5',' 	  5.5','	    6','Click mouse to display plot')" onMouseOut="HidePopup()">


list_of_states = ['nsw', 'vic', 'qld', 'sa', 'wa', 'tas', 'nt'] # act is under nsw


# Packages ########################################
from bs4 import BeautifulSoup
import requests
import re 
import json

# Functions ########################################
def get_html_content(url):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
    }

    try:
        # Send a GET request to the URL with custom headers
        response = requests.get(url, headers=headers)
        
        # Check if the request was successful (status code 200)
        if response.status_code == 200:
            return response.text
        else:
            return f"Error: Unable to fetch the page. Status code: {response.status_code}"
    
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"
    
def extract_floodmap_links(html_content):
    
    soup = BeautifulSoup(html_content, 'html.parser')

    # Find the floodmap <map> element
    floodmap = soup.find('map', {'name': 'floodmap'})
    if not floodmap:
        return []
    
    # Extract all hrefs from <area> tags
    links = [area.get('href') for area in floodmap.find_all('area') if area.get('href')]
    
    return links

import re
import requests
from bs4 import BeautifulSoup

def extract_river_data(url):
    response = requests.get(url)
    if response.status_code != 200:
        return []
    
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Find the <map> element
    map_element = soup.find('map')
    if not map_element:
        return []
    
    data_list = []
    
    for area in map_element.find_all('area'):
        onmouseover = area.get('onMouseOver', '')
        
        # Match the javascript:PopupRiver function call
        match = re.search(r"PopupRiver\('(.+?)','(.+?)','(.+?)','(.+?)','(.+?)','(.+?)','(.+?)','(.+?)','(.+?)','(.+?)','(.+?)'", onmouseover)
        if match:
            data = {
                "name": match.group(1).strip(),
                "station_id": match.group(2).strip(),
                "lat": float(match.group(3).strip()),
                "lon": float(match.group(4).strip()),
                "current_level": float(match.group(5).strip()),
                "flood_category": match.group(6).strip(),
                "trend": match.group(7).strip(),
                "timestamp": match.group(8).strip(),
                "minor_flood": match.group(9).strip(),
                "moderate_flood": match.group(10).strip(),
                "major_flood": match.group(11).strip(),
                "plot_url": area.get('href', '')  # Extract the link
            }
            data_list.append(data)
    
    return data_list

# Example usage
url = "https://www.bom.gov.au/qld/flood/map.shtml"

print(river_data)


# Main ########################################

for ii,state in enumerate(list_of_states):
    print(state)
    url = f"http://www.bom.gov.au/{state}/flood/"
    html_content = get_html_content(url)
    flood_links = extract_floodmap_links(html_content)
    
    for jj,link in enumerate(flood_links):
        print(link)
        url = 'http://www.bom.gov.au/qld/flood/north.shtml
        river_data = extract_river_data(link)
        # Get the station details
