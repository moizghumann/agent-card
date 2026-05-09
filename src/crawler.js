import * as cheerio from "cheerio";
import { normalizeDiscoveredUrl, isSameSite, httpError } from "./url.js";
import { cleanText, compactSnippet } from "./text.js";

const DEFAULT_MAX_PAGES = 8;
const MAX_TEXT_CHARS = 16000;
const REQUEST_TIMEOUT_MS = 12000;
const LINK_PRIORITY = [
  "contact",
  "pricing",
  "services",
  "service",
  "products",
  "product",
  "solutions",
  "about",
  "menu",
  "shop",
  "store",
  "book",
  "appointment",
  "locations",
  "support",
  "faq"
];

export async function crawlBusinessSite(startUrl, options = {}) {
  const maxPages = clampNumber(options.maxPages, 2, 12, DEFAULT_MAX_PAGES);
  const queue = [startUrl];
  const visited = new Set();
  const discovered = new Map();
  const warnings = [];
  const pages = [];

  discovered.set(startUrl, { url: startUrl, sourceUrl: startUrl, anchorText: "Start URL" });

  while (queue.length > 0 && pages.length < maxPages) {
    const currentUrl = queue.shift();
    if (!currentUrl || visited.has(currentUrl)) continue;
    visited.add(currentUrl);

    try {
      const page = await fetchAndParsePage(currentUrl, startUrl);
      pages.push(page);

      for (const link of page.links) {
        const known = discovered.get(link.url);
        if (!known) discovered.set(link.url, link);

        if (
          link.internal &&
          !visited.has(link.url) &&
          !queue.includes(link.url) &&
          pages.length + queue.length < maxPages * 2 &&
          shouldCrawl(link.url)
        ) {
          queue.push(link.url);
          queue.sort((a, b) => scoreUrl(b) - scoreUrl(a));
        }
      }
    } catch (error) {
      warnings.push({
        url: currentUrl,
        message: error.message,
        code: error.code || "FETCH_FAILED"
      });
    }
  }

  if (pages.length === 0) {
    throw httpError("No readable HTML pages could be scanned for this URL.", 422, "NO_READABLE_PAGES");
  }

  return {
    startUrl,
    maxPages,
    pages,
    discoveredPages: Array.from(discovered.values()),
    warnings
  };
}

async function fetchAndParsePage(url, startUrl) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "accept": "text/html,application/xhtml+xml",
        "user-agent": "AgentCardBusinessScanner/1.0 (+https://local.app)"
      }
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok) {
      throw httpError(`HTTP ${response.status} while fetching page.`, response.status, "HTTP_ERROR");
    }
    if (!contentType.includes("text/html")) {
      throw httpError(`Skipped non-HTML content: ${contentType || "unknown content type"}.`, 415, "NON_HTML");
    }

    const html = await response.text();
    return parseHtmlPage(url, response.url || url, html, startUrl);
  } finally {
    clearTimeout(timeout);
  }
}

function parseHtmlPage(requestedUrl, finalUrl, html, startUrl) {
  const $ = cheerio.load(html);
  $("script, style, noscript, svg, canvas, iframe").remove();

  const title = cleanText($("title").first().text());
  const metaDescription = cleanText(
    $("meta[name='description']").attr("content") ||
      $("meta[property='og:description']").attr("content") ||
      ""
  );
  const siteName = cleanText($("meta[property='og:site_name']").attr("content") || "");
  const canonical = $("link[rel='canonical']").attr("href");
  const canonicalUrl = normalizeDiscoveredUrl(canonical, finalUrl) || finalUrl;

  const headings = $("h1,h2,h3")
    .map((_i, el) => cleanText($(el).text()))
    .get()
    .filter(Boolean)
    .slice(0, 40);

  const buttons = $("button, input[type='button'], input[type='submit'], a")
    .map((_i, el) => cleanText($(el).text() || $(el).attr("value") || $(el).attr("aria-label") || ""))
    .get()
    .filter(Boolean)
    .slice(0, 120);

  const text = cleanText($("body").text()).slice(0, MAX_TEXT_CHARS);
  const links = extractLinks($, finalUrl, startUrl);
  const forms = extractForms($, finalUrl);
  const structuredData = extractStructuredData($);

  return {
    requestedUrl,
    url: canonicalUrl,
    finalUrl,
    title,
    siteName,
    metaDescription,
    headings,
    buttons,
    text,
    links,
    forms,
    structuredData,
    evidenceText: compactSnippet([title, metaDescription, headings.slice(0, 12).join(". "), text].join(". "))
  };
}

function extractLinks($, baseUrl, startUrl) {
  const seen = new Set();
  const links = [];

  $("a[href]").each((_i, el) => {
    const href = $(el).attr("href");
    const url = normalizeDiscoveredUrl(href, baseUrl);
    if (!url || seen.has(url)) return;
    seen.add(url);

    links.push({
      url,
      sourceUrl: baseUrl,
      anchorText: cleanText($(el).text() || $(el).attr("aria-label") || href || "").slice(0, 140),
      internal: isSameSite(url, startUrl)
    });
  });

  return links.slice(0, 250);
}

function extractForms($, baseUrl) {
  return $("form")
    .map((_i, form) => {
      const $form = $(form);
      const action = normalizeDiscoveredUrl($form.attr("action") || "", baseUrl);
      const fields = $form
        .find("input, textarea, select")
        .map((_j, field) => {
          const $field = $(field);
          return {
            tag: field.tagName?.toLowerCase() || "field",
            type: cleanText($field.attr("type") || $field.prop("tagName") || "text").toLowerCase(),
            name: cleanText($field.attr("name") || ""),
            label: cleanText($field.attr("aria-label") || $field.attr("placeholder") || "")
          };
        })
        .get()
        .filter((field) => field.name || field.label || field.type)
        .slice(0, 30);

      return {
        action,
        method: cleanText($form.attr("method") || "get").toUpperCase(),
        fields,
        nearbyText: compactSnippet(cleanText($form.text()), 240)
      };
    })
    .get()
    .slice(0, 12);
}

function extractStructuredData($) {
  const items = [];
  $("script[type='application/ld+json']").each((_i, el) => {
    const raw = $(el).text();
    try {
      const parsed = JSON.parse(raw);
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (node && typeof node === "object") {
          items.push(slimStructuredNode(node));
        }
      }
    } catch {
      // Invalid JSON-LD is common enough that it should not fail the scan.
    }
  });
  return items.slice(0, 12);
}

function slimStructuredNode(node) {
  const pick = {};
  for (const key of ["@type", "name", "description", "url", "telephone", "email", "address", "openingHours", "priceRange"]) {
    if (node[key]) pick[key] = node[key];
  }
  return pick;
}

function shouldCrawl(url) {
  const parsed = new URL(url);
  const path = parsed.pathname.toLowerCase();
  if (/\.(pdf|jpg|jpeg|png|gif|webp|zip|mp4|mp3|doc|docx|xls|xlsx)$/i.test(path)) return false;
  return path === "/" || LINK_PRIORITY.some((term) => path.includes(term)) || path.split("/").filter(Boolean).length <= 1;
}

function scoreUrl(url) {
  const path = new URL(url).pathname.toLowerCase();
  let score = path === "/" ? 100 : 0;
  for (let i = 0; i < LINK_PRIORITY.length; i += 1) {
    if (path.includes(LINK_PRIORITY[i])) score += LINK_PRIORITY.length - i;
  }
  score -= path.split("/").filter(Boolean).length;
  return score;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.round(number)));
}
