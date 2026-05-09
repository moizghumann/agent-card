import "../src/env.js";
import fs from "node:fs/promises";
import path from "node:path";
import { analyzeBusinessUrl } from "../src/analyzeBusinessUrl.js";

const examples = [
  { slug: "basecamp", url: "https://basecamp.com" },
  { slug: "mailchimp", url: "https://mailchimp.com" },
  { slug: "sweetgreen", url: "https://www.sweetgreen.com" }
];

await fs.mkdir(path.resolve("examples"), { recursive: true });

for (const example of examples) {
  console.log(`Analyzing ${example.url}`);
  const result = await analyzeBusinessUrl(example.url, { maxPages: 8 });
  await fs.writeFile(path.resolve("examples", `${example.slug}.json`), JSON.stringify(result, null, 2));
}
