async function downloadJsonFile(url) {
  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // Convert JSON to blob and trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const urlObject = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlObject;
      a.download = 'data.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlObject);
  } catch (err) {
      console.error("Failed to download JSON:", err);
  }
}

async function downloadHtml(url, filename = 'page.html') {
  try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const html = await response.text();

      const blob = new Blob([html], { type: 'text/html' });
      const urlObject = URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = urlObject;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      URL.revokeObjectURL(urlObject);
  } catch (err) {
      console.error("Failed to download HTML:", err);
  }
}

async function getData_Weather_BoM(loc) {
  const { name, latlng } = loc;
  
  // Example: dynamically build a URL (you may already have this)
  const jsonUrl = loc.URL.replace('.shtml', '.json').replace('/products/', '/fwo/');
  const proxyUrl = 'https://api.allorigins.win/raw?url=';
  const url = `${proxyUrl}${encodeURIComponent(jsonUrl)}`;

  console.log(jsonUrl)
  console.log(loc.URL)

  // const proxiedUrl = `https://corsproxy.io/?${jsonUrl}`;
  // const data = await downloadJsonFile(jsonUrl);
  const data = await downloadHtml(url);
  console.log(data)

  // Extract times and temperatures from BoM data
  const observations = data.observations?.data || [];

  const times = observations.map(d => d.local_date_time_full);
  const temps = observations.map(d => d.air_temp);

  const trace = {
    x: times,
    y: temps,
    mode: 'lines+markers',
    name: 'Air Temp (°C)'
  };

  const layout = {
    title: `Air Temperature at ${name}`,
    xaxis: { title: 'Time' },
    yaxis: { title: 'Temperature (°C)' }
  };

  Plotly.newPlot('plot-container', [trace], layout);

  // Show plot overlay (optional)
  document.getElementById('plot-overlay').style.display = 'block';
}

  
