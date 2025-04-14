### import library
import datetime
import time
from ftplib import FTP
import pandas as pd
import io
import os

username = 'anonymous'
password = 'nbcart@hotmail.com' 

## Set start and end time, to filter last 12 months files
today = datetime.datetime.now()

starttime  = today.replace(day=1) - datetime.timedelta(days=365) ### last 12 month
endtime = today.replace(day=1) - datetime.timedelta(days=1) ### last month

# Generate list of YYYY-MM dates
date_list = []
current_datetime = starttime
while current_datetime <= endtime:
    date_list.append(current_datetime.strftime('%Y%m'))
    current_datetime += datetime.timedelta(days=31)  # Add one month

# print("List of YYYY-MM dates between start and end time:")
# print(date_list)

# Connect to the FTP server to get list of location in NSW
def get_observation_location(ftp_server, ftp_directory ):
    with FTP(ftp_server) as ftp:
        ftp.login(username, password)
        ftp.cwd(ftp_directory)
        
        # Get list of directories in the current directory
        observe_locations_list = ftp.nlst()
        return observe_locations_list
    
# Function to download files from FTP server
def download_files_from_ftp(ftp_server, ftp_directory, local_directory, observe_location, date_list):
      with FTP(ftp_server) as ftp:

        ftp.login(username, password)
        ftp_directory_location = ftp_directory +  observe_location + '/'
        ftp.cwd(ftp_directory_location)
        filenames = [f"{observe_location}-{date}" for date in date_list ]
                    
        for filename in filenames:
            remote_filepath = f"{filename}.csv"
            local_filepath = f"{local_directory}/{filename}.csv"

            try:
                with open(local_filepath, "wb") as local_file:
                    ftp.retrbinary(f"RETR {remote_filepath}", local_file.write)   
                    print(f"File '{remote_filepath}' downloaded to '{local_filepath}'")

            except Exception as e:
                print(f"Error downloading file '{remote_filepath}': {e}")

# Define FTP server details
ftp_server = "ftp.bom.gov.au"
ftp_directory = "/anon/gen/fwo/"
# ftp://ftp.bom.gov.au/anon/gen/fwo/

# Define local directory to save files
local_directory = r"C:\Users\nickc\OneDrive\Desktop"

# Get observation locations from FTP server
observe_locations = get_observation_location(ftp_server, ftp_directory)

# Download files from FTP server
for observe_location in observe_locations:
    print(observe_location)
    # with FTP(ftp_server) as ftp:
    #     ftp.login()
    #     download_files_from_ftp(ftp_server, ftp_directory, local_directory, observe_location, date_list)
    #     time.sleep(20)