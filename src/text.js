export function cleanText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/\u00a0/g, " ")
    .trim();
}

export function compactSnippet(value, maxLength = 320) {
  const text = cleanText(value);
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 1).trim()}...`;
}

export function sentenceSnippets(text, patterns, limit = 3) {
  const normalized = cleanText(text);
  const sentences = normalized
    .split(/(?<=[.!?])\s+|\s+[|]\s+|\n+/)
    .map((sentence) => compactSnippet(sentence, 260))
    .filter(Boolean);

  const regexes = patterns.map((pattern) =>
    pattern instanceof RegExp ? pattern : new RegExp(escapeRegExp(pattern), "i")
  );

  const matches = [];
  for (const sentence of sentences) {
    if (regexes.some((regex) => regex.test(sentence))) {
      matches.push(sentence);
    }
    if (matches.length >= limit) break;
  }
  return matches;
}

export function uniqueBy(items, keyFn) {
  const seen = new Set();
  const output = [];
  for (const item of items) {
    const key = keyFn(item);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    output.push(item);
  }
  return output;
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
