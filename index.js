const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Hello depuis Railway 🚀");
});

app.get("/api", (req, res) => {
  res.json({ message: "API en ligne ✅" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur lancé sur le port ${PORT}`);
});
