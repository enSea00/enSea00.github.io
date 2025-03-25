import requests
import pandas as pd
from bs4 import BeautifulSoup

# URL of the BOM weather page
url = "http://www.bom.gov.au/products/IDT60801/IDT60801.94998.shtml"

# Fetch page content with headers
headers = {"User-Agent": "Mozilla/5.0"}
response = requests.get(url, headers=headers)

if response.status_code == 200:
    soup = BeautifulSoup(response.text, "html.parser")

    # Find table
    table = soup.find("table", {"id": "t1"})

    # Extract first row of headers (main headers)
    header_row1 = table.find_all("tr")[0]  
    headers1 = [th.get_text(strip=True) for th in header_row1.find_all("th")]

    # Extract second row of headers (subheaders, only exists for Wind)
    header_row2 = table.find_all("tr")[1]  
    headers2 = [th.get_text(strip=True) for th in header_row2.find_all("th")]

    # Expand "Wind" into individual sub-columns
    final_headers = []
    wind_index = headers1.index("Wind")  # Locate "Wind" column

    for i, h in enumerate(headers1):
        if h == "Wind":
            final_headers.extend(headers2)  # Insert Wind subheaders
        else:
            final_headers.append(h)

    # Extract rows of data
    rows = []
    for tr in table.find_all("tr")[2:]:  # Skip first 2 header rows
        cells = tr.find_all("td")
        row = [cell.get_text(strip=True) for cell in cells]

        # Ensure correct column count
        while len(row) < len(final_headers):
            row.append("")  # Fill missing columns
        rows.append(row)

    # Convert to DataFrame
    df = pd.DataFrame(rows, columns=final_headers)

    print(df.head())  # Print DataFrame

    # Save to CSV
    df.to_csv("weather_data.csv", index=False)
else:
    print(f"Failed to fetch page: {response.status_code}")
