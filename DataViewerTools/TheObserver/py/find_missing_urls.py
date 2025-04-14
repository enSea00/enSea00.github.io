js_file = 'locations_all.js'

import re
import json

# Read the JavaScript file
with open(js_file, "r", encoding="utf-8") as file:
    js_content = file.read()

# Extract the JSON-like structure from the JavaScript file
match = re.search(r"const locations\s*=\s*(\[.*\]);", js_content, re.DOTALL)

if match:
    json_data = match.group(1)  # Extract the array part
    try:
        # Convert the extracted string into a Python list
        locations = json.loads(json_data)

        # Find entries missing a URL
        missing_urls = [entry for entry in locations if not entry.get("URL")]

        # Print results
        if missing_urls:
            print(f"Found {len(missing_urls)} entries missing a URL:")
            for entry in missing_urls:
                print(entry)
        else:
            print("No missing URLs found.")

    except json.JSONDecodeError:
        print("Error: Could not parse JSON from JavaScript file.")
else:
    print("Error: Could not find the 'locations' array in the JavaScript file.")
