import express from "express";
import matchRouter from "./routes/matches.js";
const app = express();
const PORT = 8000;

app.use(express.json());

app.use("/matches", matchRouter);

app.get("/", (req, res) => {
  res.send("Server is running!");
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
