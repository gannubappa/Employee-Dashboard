const express = require("express");
const path = require("path");

const app = express();

// static files serve karega
app.use(express.static(__dirname));

// home route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(process.env.PORT || 5000, () => {
  console.log("Server running");
});