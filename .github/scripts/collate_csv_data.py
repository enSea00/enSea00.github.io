#!/usr/bin/env python3
"""
Collate CSV data files with automatic deduplication and sorting by datetime.

This script processes CSV files in specified directories, merging them into
a single _AllData.csv file per directory with deduplication based on all columns
and sorting by the DateTime column.
"""

import os
import sys
import glob
import pandas as pd
from pathlib import Path


def collate_csv_files(directory, pattern, output_filename="_AllData.csv", datetime_col=" DateTime"):
    """
    Collate all CSV files matching pattern in directory into a single file.
    
    Args:
        directory (str): Directory containing CSV files
        pattern (str): Glob pattern to match CSV files (e.g., "wave_*.csv")
        output_filename (str): Name of output file (default: "_AllData.csv")
        datetime_col (str): Name of datetime column for sorting (default: " DateTime")
    """
    dir_path = Path(directory)
    
    # Find all matching CSV files
    csv_files = sorted(glob.glob(str(dir_path / pattern)))
    
    if not csv_files:
        print(f"No CSV files found matching {pattern} in {directory}")
        return
    
    print(f"Found {len(csv_files)} CSV files in {directory}")
    
    # List to store dataframes
    all_dataframes = []
    
    # Read each CSV file
    for csv_file in csv_files:
        try:
            # Skip the _AllData.csv file itself
            if csv_file.endswith(output_filename):
                continue
                
            print(f"  Reading: {os.path.basename(csv_file)}")
            
            # Read CSV, skipping the first row (metadata line)
            # The header is on line 1 (index 1), data starts at line 2
            df = pd.read_csv(csv_file, skiprows=[0])
            
            if not df.empty:
                all_dataframes.append(df)
        except Exception as e:
            print(f"  Error reading {csv_file}: {e}")
            continue
    
    if not all_dataframes:
        print(f"No valid data found in {directory}")
        return
    
    # Concatenate all dataframes
    print(f"Concatenating {len(all_dataframes)} dataframes...")
    combined_df = pd.concat(all_dataframes, ignore_index=True)
    
    print(f"Total rows before deduplication: {len(combined_df)}")
    
    # Remove duplicate rows (based on all columns)
    combined_df = combined_df.drop_duplicates()
    
    print(f"Total rows after deduplication: {len(combined_df)}")
    
    # Sort by DateTime column if it exists
    if datetime_col in combined_df.columns:
        print(f"Sorting by {datetime_col} column...")
        # Convert to datetime for proper sorting, using mixed format to handle variations
        combined_df[datetime_col] = pd.to_datetime(combined_df[datetime_col], format='mixed')
        combined_df = combined_df.sort_values(by=datetime_col)
        # Convert back to string format to preserve original format
        # Check the original format from one of the files
        if csv_files and not csv_files[0].endswith(output_filename):
            sample_df = pd.read_csv(csv_files[0], skiprows=[0], nrows=1)
            if datetime_col in sample_df.columns:
                sample_datetime = str(sample_df[datetime_col].iloc[0])
                if 'T' in sample_datetime and sample_datetime.count(':') == 2:
                    # Format is like "2025-10-20T00:00:00" with seconds
                    combined_df[datetime_col] = combined_df[datetime_col].dt.strftime('%Y-%m-%dT%H:%M:%S')
                elif 'T' in sample_datetime and sample_datetime.count(':') == 1:
                    # Format is like "2025-10-20T00:00" without seconds
                    combined_df[datetime_col] = combined_df[datetime_col].dt.strftime('%Y-%m-%dT%H:%M')
                else:
                    # Default format with seconds
                    combined_df[datetime_col] = combined_df[datetime_col].dt.strftime('%Y-%m-%dT%H:%M:%S')
    else:
        print(f"Warning: {datetime_col} column not found in data")
    
    # Write to output file with metadata line
    output_path = dir_path / output_filename
    print(f"Writing to {output_path}")
    
    # Create metadata line
    metadata_line = f"Collated data - Last updated: {pd.Timestamp.now().strftime('%Y-%m-%d %H:%M:%S')}"
    
    # Write metadata line first, then the dataframe
    with open(output_path, 'w') as f:
        f.write(metadata_line + '\n')
    
    # Append the dataframe
    combined_df.to_csv(output_path, mode='a', index=False)
    
    print(f"Successfully created {output_path} with {len(combined_df)} rows\n")


def main():
    """Main function to collate CSV data files."""
    
    # Define the directories and patterns to process
    datasets = [
        {
            "directory": "data/waves",
            "pattern": "wave_*.csv",
            "output": "_AllData.csv",
            "datetime_col": " DateTime"
        },
        {
            "directory": "data/tides",
            "pattern": "tide_storm_*.csv",
            "output": "tide_storm_AllData.csv",
            "datetime_col": " DateTime"
        },
        {
            "directory": "data/tides",
            "pattern": "tide_std_*.csv",
            "output": "tide_std_AllData.csv",
            "datetime_col": " DateTime"
        }
    ]
    
    print("=" * 60)
    print("CSV Data Collation Script")
    print("=" * 60)
    print()
    
    for dataset in datasets:
        print(f"Processing: {dataset['directory']}/{dataset['pattern']}")
        print("-" * 60)
        
        try:
            collate_csv_files(
                directory=dataset["directory"],
                pattern=dataset["pattern"],
                output_filename=dataset["output"],
                datetime_col=dataset["datetime_col"]
            )
        except Exception as e:
            print(f"Error processing {dataset['directory']}: {e}\n")
            continue
    
    print("=" * 60)
    print("Collation complete!")
    print("=" * 60)


if __name__ == "__main__":
    main()
