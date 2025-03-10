import csv
import json

def csv_to_json(csv_filepath, json_filepath):
    """Convert a CSV file to a JSON file."""
    try:
        with open(csv_filepath, mode='r', encoding='utf-8') as csv_file:
            csv_reader = csv.DictReader(csv_file)  # Read CSV as dictionary
            data = [row for row in csv_reader]  # Convert to a list of dictionaries

        with open(json_filepath, mode='w', encoding='utf-8') as json_file:
            json.dump(data, json_file, indent=4)  # Save JSON with formatting

        print(f"CSV converted successfully! JSON saved to {json_filepath}")
    except Exception as e:
        print(f"Error: {e}")

# Example usage
csv_to_json('input.csv', 'output.json')
