
import cdsapi
import os
from concurrent.futures import ThreadPoolExecutor, as_completed

start_date = 198709
end_date = 202510

# List of years to process
years = [
    "1987", "1988", "1989", "1990", "1991", "1992", "1993", "1994", "1995",
    "1996", "1997", "1998", "1999", "2000", "2001", "2002", "2003", "2004",
    "2005", "2006", "2007", "2008", "2009", "2010", "2011", "2012", "2013",
    "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021", "2022",
    "2023", "2024", "2025"
]

months = [
    "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"
]
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


os.makedirs("out", exist_ok=True)

def download_year_month(year, month):
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
    outdir = os.path.join("data", "era5")
    os.makedirs(outdir, exist_ok=True)
    outfile = os.path.join(outdir, f"era5_{year}_{month}.nc")
    print(f"[START] {year}-{month}")
    try:
        cds_result = client.retrieve(dataset, request)
        cds_result.download(outfile)
        print(f"[DONE]  {year}-{month} -> {outfile}")
    except Exception as e:
        print(f"[FAIL]  {year}-{month}: {e}")

os.makedirs(os.path.join("data", "era5"), exist_ok=True)

# Limit to 3 concurrent requests to avoid CDS API throttling
max_workers = 3
with ThreadPoolExecutor(max_workers=max_workers) as executor:
    futures = {}
    for year in sorted(years, key=int):
        for month in sorted(months, key=int):
            future = executor.submit(download_year_month, year, month)
            futures[future] = (year, month)
    for future in as_completed(futures):
        year, month = futures[future]
        try:
            future.result()
        except Exception as exc:
            print(f"[ERROR] {year}-{month}: {exc}")
