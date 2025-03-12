'''
Creates my "TheObserver.html" page, a collation of map-based links to real-time observation data pages

v1 - 
'''

# INPUTS
data_urls = r'urls_points.csv'
output_html = 'TheObserver_NEW.html'

# PACKAGES
import pandas as pd
import plotly.express as px
import plotly.utils
import json

# PROCESSING
df = pd.read_csv(data_urls, encoding="ISO-8859-1")

# Ensure Longitude and Latitude are numeric
df["Longitude"] = pd.to_numeric(df["Longitude"], errors="coerce")
df["Latitude"] = pd.to_numeric(df["Latitude"], errors="coerce")
df = df.dropna(subset=["Longitude", "Latitude"])  # Drop invalid coordinates

# Define the custom order of DataType categories
# alphabetical = ['Ocean Buoy (NDBC)' 'Rain Radar' 'River Gauge' 'Swellnet' 'Tide Gauge'
#  'Tide Prediction' 'Wave Buoy' 'Weather Station' 'Web Camera'
#  'Willy Weather' 'Surfline (No Cam)' 'Surfline (Cam)']
custom_order = ['Wave Buoy','Weather Station','River Gauge','Rain Radar','Tide Gauge','Tide Prediction','Ocean Buoy (NDBC)','Swellnet', 
   'Web Camera','Willy Weather','Surfline (No Cam)','Surfline (Cam)']
df["DataType"] = pd.Categorical(df["DataType"], categories=custom_order, ordered=True) # Convert the 'DataType' column to a categorical type with the specified order
df = df.sort_values("DataType")


# Create a zoomable map with mouse scroll enabled
custom_colors = px.colors.qualitative.D3
fig = px.scatter_map(
    df,
    lat="Latitude",
    lon="Longitude",
    text="Name",
    hover_data=["URL", "Owner"],
    zoom=2,  # Initial zoom level
    center={"lat": df["Latitude"].mean(), "lon": df["Longitude"].mean()},  # Center map
    color="DataType",
    color_discrete_sequence = custom_colors,
    title="The Observer",
)

# Attach URL data to markers
fig.update_traces(
    marker=dict(size=16),  # Adjust marker size
    customdata=df["URL"],  # Store URL in marker
    cluster=dict(enabled=True, 
                 opacity=0.7,
                 size=24,
                 step=2),  # Enable marker clustering
)

# Configure layout for full-screen
fig.update_layout(
    map_style="satellite-streets",  # A free map style
    margin=dict(l=0, r=0, t=0, b=0),
    map=dict(zoom=2),
)

# Convert figure to JSON
fig_json = json.dumps(fig, cls=plotly.utils.PlotlyJSONEncoder)

# Create the HTML file with embedded Plotly chart
html_content = f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Observer - Real-Time Observation Data</title>
    <script src="https://cdn.plot.ly/plotly-3.0.1.min.js"></script>
    <style>
        html, body {{
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
        }}
        #map {{
            width: 100vw;
            height: 100vh;
        }}
    </style>
</head>
<body>
    <div id="map"></div>
    <script>
        var fig = {fig_json};
        Plotly.newPlot('map', fig.data, fig.layout);

        // Wait for the chart to render before attaching event listener
        document.getElementById('map').on('plotly_click', function(eventData) {{
            var url = eventData.points[0].customdata;  // Get URL
            if (url) {{
                window.open(url, '_blank');  // Open URL in new tab
            }}
        }});
    </script>
</body>
</html>
"""

# Save the HTML file
with open(output_html, "w", encoding="utf-8") as f:
    f.write(html_content)

print(f"Full-screen map with clickable markers saved as '{output_html}'. Open it in a browser to view.")
