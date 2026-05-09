import "./env.js";
import { crawlBusinessSite } from "./crawler.js";
import { createBusinessMap } from "./businessMap.js";
import { generateAgentCard } from "./agentCard.js";
import { enhanceBusinessMapWithLlm } from "./llmBusinessMap.js";
import { generateAgentCardWithOptionalLlm } from "./llmAgentCard.js";
import { normalizeStartUrl } from "./url.js";

export async function analyzeBusinessUrl(inputUrl, options = {}) {
  const startUrl = normalizeStartUrl(inputUrl);
  const crawl = await crawlBusinessSite(startUrl, options);
  const deterministicMap = createBusinessMap(crawl);
  const mapResult = options.useLlm === false
    ? { map: deterministicMap, usedLlm: false, warning: null }
    : await enhanceBusinessMapWithLlm(deterministicMap);
  const cardResult = options.useLlm === false
    ? { card: generateAgentCard(mapResult.map), usedLlm: false, warning: null }
    : await generateAgentCardWithOptionalLlm(mapResult.map);
  const warnings = [...crawl.warnings];

  if (mapResult.warning) warnings.push({ message: mapResult.warning, code: "LLM_MAP_FALLBACK" });
  if (cardResult.warning) warnings.push({ message: cardResult.warning, code: "LLM_CARD_FALLBACK" });

  return {
    inputUrl: startUrl,
    analyzedAt: new Date().toISOString(),
    scan: {
      requestedMaxPages: crawl.maxPages,
      pagesScanned: crawl.pages.length,
      pagesDiscovered: crawl.discoveredPages.length,
      usedLlmForBusinessMap: mapResult.usedLlm,
      usedLlmForAgentCard: cardResult.usedLlm,
      warnings
    },
    businessMap: mapResult.map,
    agentCard: cardResult.card
  };
}
