import ftplib
import os
import tarfile
import logging
import time

# Setup logging
logging.basicConfig(
    filename="ftp_download_log.txt",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# FTP server details
ftp_host = "ftp.bom.gov.au"
ftp_file_path = "anon/gen/fwo/IDN11036.pdf"
local_file_path = "IDN11036.pdf"
extracted_folder = "extracted_files"

# Log that the script started
logging.info("Script started")

# Delete existing file if it exists
if os.path.exists(local_file_path):
    try:
        os.remove(local_file_path)
        logging.info(f"Deleted existing file '{local_file_path}'.")
    except Exception as e:
        logging.error(f"Failed to delete existing file: {e}")
        exit(1)

# Connect to FTP server with retry logic
ftp = None
max_attempts = 3
for attempt in range(max_attempts):
    try:
        ftp = ftplib.FTP(ftp_host, timeout=120)
        ftp.set_pasv(True)
        logging.info(f"Connected to FTP server '{ftp_host}' (Attempt {attempt + 1})")
        break
    except ftplib.all_errors as e:
        logging.warning(f"Connection attempt {attempt + 1} failed: {e}")
        if attempt < max_attempts - 1:
            time.sleep(5)
        else:
            logging.error("Exceeded maximum connection attempts.")
            exit(1)

# Login anonymously
try:
    ftp.login()
    logging.info("Logged in anonymously.")
except ftplib.all_errors as e:
    logging.error(f"Failed to login: {e}")
    ftp.quit()
    exit(1)

def list_files_with_retry(ftp, retries=3):
    for attempt in range(retries):
        try:
            return ftp.nlst(os.path.dirname(ftp_file_path))
        except ftplib.all_errors as e:
            logging.warning(f"Attempt {attempt + 1} to list files failed: {e}")
            if attempt < retries - 1:
                time.sleep(5)  # Delay before retrying
            else:
                logging.error("Failed to list files after multiple attempts.")
                exit(1)

files = list_files_with_retry(ftp)
logging.info(f"Files on server: {files}")



# Attempt to download the file
try:
    with open(local_file_path, "wb") as local_file:
        ftp.retrbinary(f"RETR {ftp_file_path}", local_file.write)
    logging.info(f"File '{ftp_file_path}' downloaded successfully as '{local_file_path}'.")
except ftplib.all_errors as e:
    logging.error(f"Failed to download the file: {e}")
    ftp.quit()
    exit(1)
finally:
    if ftp:
        try:
            ftp.quit()
            logging.info("FTP connection closed.")
        except Exception as e:
            logging.warning(f"Error closing FTP: {e}")


# Optional: Check magic bytes to confirm gzip format
try:
    with open(local_file_path, 'rb') as f:
        magic = f.read(4)
    logging.info(f"File magic bytes: {magic}")
except Exception as e:
    logging.warning(f"Could not read magic bytes: {e}")

# Extract if it's a .tgz (gzip-compressed tar)
try:
    with tarfile.open(local_file_path, "r:gz") as tar:
        tar.extractall(path=extracted_folder)
    logging.info(f"File extracted successfully into '{extracted_folder}'.")
except tarfile.TarError as e:
    logging.error(f"Error extracting the .tgz file: {e}")

# Script complete
logging.info("Script finished.")
time.sleep(5)  # Optional delay to help prevent FTP reconnect issues
