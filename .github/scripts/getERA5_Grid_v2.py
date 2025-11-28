import cdsapi
import os
import sys

# Static request parameters
days = [
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
    "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "24",
    "25", "26", "27", "28", "29", "30", "31"
]
times = [
    "00:00", "01:00", "02:00", "03:00", "04:00", "05:00", "06:00", "07:00", "08:00",
    "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
    "18:00", "19:00", "20:00", "21:00", "22:00", "23:00"
]
variables = [
    "mean_sea_level_pressure",
    "mean_wave_direction",
    "significant_height_of_combined_wind_waves_and_swell",
    "total_precipitation",
    "maximum_individual_wave_height",
    "mean_zero_crossing_wave_period",
    "model_bathymetry",
    "peak_wave_period"
]
dataset = "reanalysis-era5-single-levels"
area = [-27.99, 153.45, -28.01, 153.55]

def main():
    if len(sys.argv) != 3:
        print("Usage: python getERA5_Grid_v2.py <year> <month>")
        sys.exit(1)
    year = sys.argv[1]
    month = sys.argv[2]
    outdir = os.path.join("data", "era5")
    os.makedirs(outdir, exist_ok=True)
    outfile = os.path.join(outdir, f"era5_{year}_{month}.nc")
    print(f"[START] {year}-{month}")
    client = cdsapi.Client()
    request = {
        "product_type": ["reanalysis"],
        "variable": variables,
        "year": [year],
        "month": [month],
        "day": days,
        "time": times,
        "data_format": "netcdf",
        "download_format": "unarchived",
        "area": area
    }
    try:
        cds_result = client.retrieve(dataset, request)
        cds_result.download(outfile)
        print(f"[DONE]  {year}-{month} -> {outfile}")
    except Exception as e:
        print(f"[FAIL]  {year}-{month}: {e}")

if __name__ == "__main__":
    main()
