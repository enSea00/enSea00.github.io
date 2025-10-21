async function getData_Waves_BoM(loc){
    
    const express = require("express");
    const cors = require("cors");
    const fetch = require("node-fetch");

    const app = express();
    app.use(cors());

    app.get("/proxy", async (req, res) => {
    const response = await fetch(loc.URL);
    const data = await response.text();
    res.send(data);
    });

    app.listen(3000, () => console.log("Proxy running on port 3000"));

}

