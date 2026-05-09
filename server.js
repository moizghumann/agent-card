import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import "./src/env.js";
import { analyzeBusinessUrl } from "./src/analyzeBusinessUrl.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/analyze", async (req, res) => {
  try {
    const { url, options = {} } = req.body ?? {};
    const result = await analyzeBusinessUrl(url, options);
    res.json(result);
  } catch (error) {
    const status = error.statusCode || 500;
    res.status(status).json({
      error: {
        message: error.message || "Unable to analyze URL",
        code: error.code || "ANALYSIS_FAILED"
      }
    });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`Agent Card Business Scanner running at http://localhost:${port}`);
});
