import { callOpenRouterJson, isOpenRouterConfigured } from "./openRouter.js";

const MAP_SYSTEM_PROMPT = `You refine an evidence-backed business map for an AI agent.
Rules:
- Do not invent facts.
- Every important claim must cite evidence IDs that exist in the provided evidenceIndex.
- If evidence is weak or absent, use "unknown" or add a missingOrUnclear note.
- Preserve the required top-level business map shape.
- Prefer clear, business-useful labels over marketing slogans, but only when the evidence supports them.
- Return only JSON.`;

export async function enhanceBusinessMapWithLlm(deterministicMap) {
  if (!isOpenRouterConfigured()) {
    return { map: deterministicMap, usedLlm: false, warning: null };
  }

  try {
    const refined = await callOpenRouterJson({
      system: MAP_SYSTEM_PROMPT,
      user: JSON.stringify({
        task: "Refine this deterministic business map. Keep the same schema. Claims must cite evidence IDs from evidenceIndex.",
        businessMap: deterministicMap
      })
    });

    return {
      map: sanitizeBusinessMap(refined, deterministicMap),
      usedLlm: true,
      warning: null
    };
  } catch (error) {
    return {
      map: deterministicMap,
      usedLlm: false,
      warning: `LLM business-map refinement failed; deterministic map used instead. ${error.message}`
    };
  }
}

function sanitizeBusinessMap(candidate, fallback) {
  const evidenceIds = new Set(fallback.evidenceIndex.map((entry) => entry.id));
  const map = candidate && typeof candidate === "object" ? candidate : fallback;

  map.mapVersion = fallback.mapVersion;
  map.scope = fallback.scope;
  map.pagesFound = Array.isArray(map.pagesFound) ? map.pagesFound : fallback.pagesFound;
  map.evidenceIndex = fallback.evidenceIndex;

  map.business = sanitizeBusiness(map.business, fallback.business, evidenceIds);
  map.offerings = sanitizeArray(map.offerings, fallback.offerings, evidenceIds, sanitizeOffering);
  map.customerActions = sanitizeArray(map.customerActions, fallback.customerActions, evidenceIds, sanitizeAction);
  map.toolsFormsLinks = sanitizeArray(map.toolsFormsLinks, fallback.toolsFormsLinks, evidenceIds, sanitizeTool);
  map.visibleInfo = sanitizeVisibleInfo(map.visibleInfo, fallback.visibleInfo, evidenceIds);
  map.missingOrUnclear = Array.isArray(map.missingOrUnclear)
    ? map.missingOrUnclear.filter((item) => typeof item === "string" && item.trim()).slice(0, 20)
    : fallback.missingOrUnclear;

  return map;
}

function sanitizeBusiness(candidate = {}, fallback, evidenceIds) {
  return {
    name: stringOr(candidate.name, fallback.name),
    description: stringOr(candidate.description, fallback.description),
    likelyTypes: arrayOfStrings(candidate.likelyTypes, fallback.likelyTypes),
    confidence: ["low", "medium", "high"].includes(candidate.confidence) ? candidate.confidence : fallback.confidence,
    evidence: validEvidence(candidate.evidence, evidenceIds, fallback.evidence)
  };
}

function sanitizeOffering(item, fallback, evidenceIds) {
  return {
    name: stringOr(item.name, fallback.name),
    category: stringOr(item.category, fallback.category),
    evidence: validEvidence(item.evidence, evidenceIds, fallback.evidence)
  };
}

function sanitizeAction(item, fallback, evidenceIds) {
  return {
    action: stringOr(item.action, fallback.action),
    label: stringOr(item.label, fallback.label),
    targetUrl: stringOr(item.targetUrl, fallback.targetUrl),
    mechanism: stringOr(item.mechanism, fallback.mechanism),
    confidence: ["low", "medium", "high"].includes(item.confidence) ? item.confidence : fallback.confidence,
    evidence: validEvidence(item.evidence, evidenceIds, fallback.evidence)
  };
}

function sanitizeTool(item, fallback, evidenceIds) {
  return {
    type: stringOr(item.type, fallback.type),
    label: stringOr(item.label, fallback.label),
    url: item.url || fallback.url || null,
    method: item.method || fallback.method || null,
    fields: Array.isArray(item.fields) ? item.fields : fallback.fields,
    external: Boolean(item.external ?? fallback.external),
    evidence: validEvidence(item.evidence, evidenceIds, fallback.evidence)
  };
}

function sanitizeVisibleInfo(candidate = {}, fallback, evidenceIds) {
  return {
    contact: sanitizeInfoArray(candidate.contact, fallback.contact, evidenceIds),
    payment: sanitizeInfoArray(candidate.payment, fallback.payment, evidenceIds),
    auth: sanitizeInfoArray(candidate.auth, fallback.auth, evidenceIds),
    locations: sanitizeInfoArray(candidate.locations, fallback.locations, evidenceIds),
    hours: sanitizeInfoArray(candidate.hours, fallback.hours, evidenceIds)
  };
}

function sanitizeInfoArray(candidate, fallback, evidenceIds) {
  if (!Array.isArray(candidate)) return fallback;
  return candidate
    .filter((item) => item && typeof item === "object")
    .map((item, index) => ({
      ...item,
      evidence: validEvidence(item.evidence, evidenceIds, fallback[index]?.evidence || [])
    }))
    .filter((item) => item.evidence.length > 0)
    .slice(0, 20);
}

function sanitizeArray(candidate, fallback, evidenceIds, sanitizer) {
  if (!Array.isArray(candidate)) return fallback;
  return candidate
    .filter((item) => item && typeof item === "object")
    .map((item, index) => sanitizer(item, fallback[index] || {}, evidenceIds))
    .filter((item) => item.evidence.length > 0)
    .slice(0, 30);
}

function validEvidence(ids, evidenceIds, fallback = []) {
  const valid = Array.isArray(ids) ? ids.filter((id) => evidenceIds.has(id)) : [];
  return valid.length ? valid : fallback.filter((id) => evidenceIds.has(id));
}

function stringOr(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback || "unknown";
}

function arrayOfStrings(value, fallback) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item.trim()).slice(0, 10) : fallback;
}
