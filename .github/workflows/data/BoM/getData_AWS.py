import json
import requests
import os
import time

# Path to the local JSON file
json_file_path = 'locations_aws.json'  # Path to your JSON file
output_path = r'data\BoM\aws_json'
os.makedirs(output_path, exist_ok=True)

# Load the JSON data from the file
with open(json_file_path, 'r') as file:
    data = json.load(file)
print(len(data))
# Define how many URLs to download
N = len(data)  # Change this to your desired number of URLs

# Custom headers to mimic a real browser request
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
    "Accept": "application/json",
    "Referer": "http://www.bom.gov.au/",
}

start_time = time.time()

# Download the first N URLs
for i in range(min(N, len(data))):
    url = data[i]["URL"].replace('shtml', 'json').replace('products', 'fwo')
    file_name = url.split('/')[-1]
    try:
        response = requests.get(url, headers=headers)
        if response.status_code == 200:
            file_name = os.path.join(output_path, file_name)
            with open(file_name, "wb") as f:
                f.write(response.content)
            print(f"Downloaded {url} as {file_name}")
        else:
            print(f"Failed to download {url}: Status code {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error downloading {url}: {e}")

end_time = time.time()
elapsed_time = end_time - start_time
print(f"\nDownloaded {min(N, len(data))} files in {elapsed_time:.2f} seconds.")
