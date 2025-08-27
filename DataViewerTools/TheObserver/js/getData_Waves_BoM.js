async function getData_Waves_BoM(loc){
    // async function extractWaveTableUrl(pageUrl) {
    //     try {
    //         // fetch the page HTML
    //         const response = await fetch(pageUrl);
    //         const htmlText = await response.text();

    //         // parse the HTML into a DOM
    //         const parser = new DOMParser();
    //         const doc = parser.parseFromString(htmlText, "text/html");

    //         // look for the link containing "Wave Height and Wave Period Table"
    //         const link = Array.from(doc.querySelectorAll("a"))
    //             .find(a => a.textContent.includes("Wave Height and Wave Period Table"));

    //         if (link) {
    //             // build absolute URL if needed
    //             const absoluteUrl = new URL(link.getAttribute("href"), pageUrl).href;
    //             return absoluteUrl;
    //         } else {
    //             throw new Error("Link not found.");
    //         }
    //     } catch (err) {
    //         console.error("Error extracting URL:", err);
    //         return null;
    //     }
    // }

    // // Example usage:
    // extractWaveTableUrl(loc.URL).then(url => {
    //     console.log("Found URL:", url);
    // });

    async function downloadHtml(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const html = await response.text();
            console.log(html); // prints the full HTML
            return html;
        } catch (err) {
            console.error("Error downloading HTML:", err);
        }
    }

    // Example usage
    downloadHtml(loc.URL);

    console.log(loc)

}

