import "../src/env.js";
import { analyzeBusinessUrl } from "../src/analyzeBusinessUrl.js";

const url = process.argv[2];

if (!url) {
  console.error("Usage: npm run analyze -- https://example.com");
  process.exit(1);
}

try {
  const result = await analyzeBusinessUrl(url, { maxPages: Number(process.env.MAX_PAGES || 8) });
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(error.message);
  process.exit(1);
}
