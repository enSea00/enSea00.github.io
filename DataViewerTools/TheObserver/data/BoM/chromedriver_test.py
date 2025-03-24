from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

# Setup WebDriver with options
options = webdriver.ChromeOptions()
options.add_argument("--headless")  # Run without opening a browser
driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

# Load the page
url = "https://www.bom.gov.au/australia/tides/#!/nsw-yamba"
driver.get(url)

# Verify loaded URL
print("Loaded URL:", driver.current_url)

try:
    # Wait for the "site-info" div to be dynamically loaded
    site_info = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, "site-info"))
    )

    # Extract Latitude & Longitude
    latitude_element = driver.find_element(By.XPATH, "//p[span[contains(text(),'Latitude')]]/span[@class='data']")
    longitude_element = driver.find_element(By.XPATH, "//p[span[contains(text(),'Longitude')]]/span[@class='data']")

    latitude = latitude_element.text.strip()
    longitude = longitude_element.text.strip()

    print(f"Latitude: {latitude}")
    print(f"Longitude: {longitude}")

except Exception as e:
    print("Error:", e)

# Close the browser
driver.quit()
