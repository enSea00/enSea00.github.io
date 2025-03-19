import ftplib
import os
import tarfile

# FTP server details
ftp_host = "ftp.bom.gov.au"
# ftp_host = "134.178.253.145"  # IP address for ftp.bom.gov.au
ftp_file_path = "/anon/gen/fwo/IDQ60910.tgz"
local_file_path = "IDQ60910.tgz"
extracted_folder = "extracted_files"

# Check if the file exists and delete it if it does
if os.path.exists(local_file_path):
    print(f"File '{local_file_path}' already exists. Deleting it...")
    os.remove(local_file_path)
    print(f"File '{local_file_path}' deleted successfully.")

# Connect to the FTP server with passive mode and increased timeout
ftp = ftplib.FTP(ftp_host, timeout=120)
ftp.set_pasv(True)

# Login anonymously
ftp.login()

# Adjust chunk size for faster download
chunk_size = 32768  # 32 KB chunk size

# Open a local file to save the downloaded .tgz file
# Check if a partially downloaded file exists
try:
    with open(local_file_path, "rb") as f:
        file_size = len(f.read())
    print(f"Resuming download from {file_size} bytes...")
    with open(local_file_path, "ab") as local_file:
        ftp.retrbinary(f"RETR {ftp_file_path}", local_file.write, rest=file_size)
except FileNotFoundError:
    # File doesn't exist, so download it from the beginning
    with open(local_file_path, "wb") as local_file:
        ftp.retrbinary(f"RETR {ftp_file_path}", local_file.write)


# Close the FTP connection
ftp.quit()

print(f"File '{ftp_file_path}' downloaded successfully as '{local_file_path}'.")

# Extract the .tgz file
try:
    with tarfile.open(local_file_path, "r:gz") as tar:
        # Extract to the specified folder
        tar.extractall(path=extracted_folder)
    print(f"File '{local_file_path}' extracted successfully into '{extracted_folder}'.")

except tarfile.TarError as e:
    print(f"Error extracting the .tgz file: {e}")
