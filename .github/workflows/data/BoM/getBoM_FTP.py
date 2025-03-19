import ftplib
import os
import tarfile
import logging

# Setup logging
logging.basicConfig(
    filename="ftp_download_log.txt",  # Log file location
    level=logging.INFO,  # Log level
    format="%(asctime)s - %(levelname)s - %(message)s",  # Log format
)

# FTP server details
ftp_host = "ftp.bom.gov.au"
# ftp_host = "134.178.253.145"  # IP address for ftp.bom.gov.au
ftp_file_path = "/anon/gen/fwo/IDQ60910.tgz"
local_file_path = "IDQ60910.tgz"
extracted_folder = "extracted_files"

# Log that the script started
logging.info("Script started")

# Check if the file exists and delete it if it does
if os.path.exists(local_file_path):
    logging.info(f"File '{local_file_path}' already exists. Deleting it...")
    os.remove(local_file_path)
    logging.info(f"File '{local_file_path}' deleted successfully.")

# Connect to the FTP server with passive mode and increased timeout
try:
    ftp = ftplib.FTP(ftp_host, timeout=120)
    ftp.set_pasv(True)
    logging.info(f"Connected to FTP server '{ftp_host}'")
except ftplib.all_errors as e:
    logging.error(f"Failed to connect to FTP server: {e}")
    exit(1)

# Login anonymously
try:
    ftp.login()
    logging.info("Logged in anonymously")
except ftplib.all_errors as e:
    logging.error(f"Failed to login: {e}")
    ftp.quit()
    exit(1)

# Adjust chunk size for faster download
chunk_size = 32768  # 32 KB chunk size

# Open a local file to save the downloaded .tgz file
# Check if a partially downloaded file exists
try:
    with open(local_file_path, "rb") as f:
        file_size = len(f.read())
    logging.info(f"Resuming download from {file_size} bytes...")
    with open(local_file_path, "ab") as local_file:
        ftp.retrbinary(f"RETR {ftp_file_path}", local_file.write, rest=file_size)
except FileNotFoundError:
    # File doesn't exist, so download it from the beginning
    try:
        with open(local_file_path, "wb") as local_file:
            ftp.retrbinary(f"RETR {ftp_file_path}", local_file.write)
        logging.info(f"File '{ftp_file_path}' downloaded successfully as '{local_file_path}'.")
    except ftplib.all_errors as e:
        logging.error(f"Failed to download the file: {e}")
        ftp.quit()
        exit(1)

# Close the FTP connection
ftp.quit()
logging.info(f"FTP connection closed.")

# Extract the .tgz file
#try:
#    with tarfile.open(local_file_path, "r:gz") as tar:
#        # Extract to the specified folder
#        tar.extractall(path=extracted_folder)
#    logging.info(f"File '{local_file_path}' extracted successfully into '{extracted_folder}'.")
#except tarfile.TarError as e:
#    logging.error(f"Error extracting the .tgz file: {e}")

# Log that the script finished
logging.info("Script finished")
