import { compactSnippet, sentenceSnippets, uniqueBy } from "./text.js";

const ACTION_PATTERNS = [
  {
    action: "contact_business",
    label: "Contact the business",
    patterns: [/(^|\s|\/)contact(\s+(us|sales|support)|\/|$)/i, /get in touch/i, /request info/i, /let us know/i]
  },
  { action: "request_quote", label: "Request a quote or estimate", patterns: [/quote/i, /estimate/i, /proposal/i] },
  { action: "book_or_schedule", label: "Book or schedule", patterns: [/\bbook\s+(now|a|an|online|appointment|demo|table|reservation)\b/i, /schedule/i, /appointment/i, /reservation/i] },
  { action: "buy_or_checkout", label: "Buy, order, or checkout", patterns: [/buy/i, /cart/i, /checkout/i, /order/i, /pricing/i, /plans/i] },
  { action: "sign_in", label: "Sign in or access an account", patterns: [/log in/i, /login/i, /sign in/i, /account/i, /portal/i] },
  { action: "apply_or_join", label: "Apply, join, or start onboarding", patterns: [/apply/i, /join/i, /get started/i] },
  { action: "get_support", label: "Get support or help", patterns: [/support/i, /help/i, /faq/i, /customer service/i] }
];

const TOOL_PATTERNS = [
  { kind: "phone", patterns: [/^tel:/i] },
  { kind: "email", patterns: [/^mailto:/i] },
  { kind: "payment_or_cart", patterns: [/cart/i, /checkout/i, /pay/i, /pricing/i, /plans/i] },
  { kind: "auth", patterns: [/login/i, /log in/i, /sign in/i, /account/i, /portal/i] },
  { kind: "booking", patterns: [/\bbook\s+(now|a|an|online|appointment|demo|table|reservation)\b/i, /schedule/i, /appointment/i, /reservation/i] },
  { kind: "social", patterns: [/linkedin/i, /instagram/i, /facebook/i, /twitter/i, /x\.com/i, /youtube/i] }
];

export function createBusinessMap(crawl) {
  const pages = crawl.pages;
  const evidence = createEvidenceCollector();
  const pagesFound = mapPagesFound(crawl);
  const business = identifyBusiness(pages, evidence);
  const offerings = identifyOfferings(pages, evidence);
  const customerActions = identifyCustomerActions(pages, evidence);
  const toolsFormsLinks = identifyToolsFormsLinks(pages, evidence);
  const visibleInfo = identifyVisibleInfo(pages, evidence);
  const missingOrUnclear = identifyMissingOrUnclear({
    business,
    offerings,
    customerActions,
    toolsFormsLinks,
    visibleInfo,
    pages
  });

  return {
    mapVersion: "1.0",
    scope: {
      startUrl: crawl.startUrl,
      pagesScanned: pages.length,
      crawlLimit: crawl.maxPages,
      method: "same-site HTML crawl with deterministic evidence extraction"
    },
    pagesFound,
    business,
    offerings,
    customerActions,
    toolsFormsLinks,
    visibleInfo,
    missingOrUnclear,
    evidenceIndex: evidence.all()
  };
}

function mapPagesFound(crawl) {
  return crawl.discoveredPages.slice(0, 80).map((page) => {
    const scanned = crawl.pages.find((candidate) => sameUrl(candidate.finalUrl, page.url) || sameUrl(candidate.url, page.url));
    return {
      url: page.url,
      anchorText: page.anchorText || "Unknown",
      sourceUrl: page.sourceUrl,
      scanned: Boolean(scanned),
      title: scanned?.title || null
    };
  });
}

function identifyBusiness(pages, evidence) {
  const homepage = pages[0];
  const structuredOrg = pages.flatMap((page) => page.structuredData).find((node) => {
    const type = Array.isArray(node["@type"]) ? node["@type"].join(" ") : node["@type"];
    return /Organization|LocalBusiness|Store|Restaurant|Corporation|ProfessionalService/i.test(type || "");
  });

  const name = structuredOrg?.name || homepage.siteName || cleanTitle(homepage.title) || "unknown";
  const description = structuredOrg?.description || homepage.metaDescription || homepage.headings[0] || "unknown";
  const businessTypes = inferBusinessTypes(pages);

  const nameEvidence = name === "unknown" ? [] : [evidence.add(homepage.url, homepage.title || homepage.siteName || name, "business_name")];
  const descriptionEvidence =
    description === "unknown" ? [] : [evidence.add(homepage.url, description, "business_description")];

  return {
    name,
    description,
    likelyTypes: businessTypes.length ? businessTypes : ["unknown"],
    confidence: name !== "unknown" && description !== "unknown" ? "medium" : "low",
    evidence: [...nameEvidence, ...descriptionEvidence]
  };
}

function identifyOfferings(pages, evidence) {
  const candidates = [];
  for (const page of pages) {
    const pageLooksRelevant = /product|service|solution|menu|shop|store|pricing|plans|offer/i.test(
      `${page.url} ${page.title} ${page.metaDescription}`
    );

    for (const heading of page.headings) {
      if (heading.length < 4 || heading.length > 100) continue;
      if (isNavigationNoise(heading)) continue;
      const relevantHeading = pageLooksRelevant || /service|product|solution|menu|plan|pricing/i.test(heading);
      if (relevantHeading) {
        candidates.push({
          name: heading,
          category: inferOfferingCategory(heading, page),
          evidence: [evidence.add(page.url, heading, "offering_heading")]
        });
      }
    }

    const snippets = sentenceSnippets(page.text, [/we offer/i, /services include/i, /products include/i, /solutions/i], 3);
    for (const snippet of snippets) {
      candidates.push({
        name: compactSnippet(snippet, 110),
        category: inferOfferingCategory(snippet, page),
        evidence: [evidence.add(page.url, snippet, "offering_snippet")]
      });
    }
  }

  return uniqueBy(candidates, (item) => item.name.toLowerCase()).slice(0, 12);
}

function identifyCustomerActions(pages, evidence) {
  const actions = [];
  for (const actionDef of ACTION_PATTERNS) {
    for (const page of pages) {
      const linkMatches = page.links.filter((link) => {
        const haystack = actionLinkHaystack(actionDef.action, link);
        return actionDef.patterns.some((pattern) => pattern.test(haystack));
      });
      const buttonMatches = page.buttons.filter((button) => actionDef.patterns.some((pattern) => pattern.test(button)));
      const formMatches = page.forms.filter((form) => {
        const haystack = actionDef.action === "contact_business" ? form.nearbyText : `${form.action || ""} ${form.nearbyText}`;
        return actionDef.patterns.some((pattern) => pattern.test(haystack));
      });

      const quote = linkMatches[0]?.anchorText || buttonMatches[0] || formMatches[0]?.nearbyText;
      if (quote) {
        actions.push({
          action: actionDef.action,
          label: actionDef.label,
          targetUrl: linkMatches[0]?.url || formMatches[0]?.action || page.url,
          mechanism: formMatches.length ? "form" : linkMatches.length ? "link" : "button_or_text",
          confidence: formMatches.length || linkMatches.length ? "medium" : "low",
          evidence: [evidence.add(page.url, quote, `customer_action:${actionDef.action}`)]
        });
        break;
      }
    }
  }
  return actions;
}

function identifyToolsFormsLinks(pages, evidence) {
  const items = [];

  for (const page of pages) {
    for (const form of page.forms) {
      items.push({
        type: "form",
        label: inferFormLabel(form),
        url: form.action || page.url,
        method: form.method,
        fields: form.fields,
        evidence: [evidence.add(page.url, form.nearbyText || `Form with ${form.fields.length} fields`, "form")]
      });
    }

    for (const toolDef of TOOL_PATTERNS) {
      const links = page.links.filter((link) => {
        const haystack = toolDef.kind === "phone" || toolDef.kind === "email" ? link.url : `${link.anchorText} ${link.url}`;
        return toolDef.patterns.some((pattern) => pattern.test(haystack));
      });
      for (const link of links.slice(0, 4)) {
        items.push({
          type: toolDef.kind,
          label: link.anchorText || toolDef.kind,
          url: link.url,
          external: !link.internal,
          evidence: [evidence.add(page.url, `${link.anchorText || link.url} -> ${link.url}`, `tool:${toolDef.kind}`)]
        });
      }
    }
  }

  return uniqueBy(items, (item) => `${item.type}:${item.url}:${item.label}`.toLowerCase()).slice(0, 30);
}

function actionLinkHaystack(action, link) {
  if (action === "contact_business") {
    return `${link.anchorText} ${new URL(link.url).pathname.replace(/contacts/gi, "")}`;
  }
  if (action === "book_or_schedule") {
    return link.anchorText;
  }
  return `${link.anchorText} ${link.url}`;
}

function identifyVisibleInfo(pages, evidence) {
  const links = pages.flatMap((page) => page.links.map((link) => ({ ...link, pageUrl: page.url })));
  const info = {
    contact: [],
    payment: [],
    auth: [],
    locations: [],
    hours: []
  };

  for (const page of pages) {
    const emails = Array.from(page.text.matchAll(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi)).map((match) => match[0]);
    const phones = Array.from(page.text.matchAll(/(?:\+?1[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/g)).map(
      (match) => match[0]
    );
    for (const email of emails.slice(0, 5)) {
      info.contact.push({ kind: "email", value: email, evidence: [evidence.add(page.url, email, "contact_email")] });
    }
    for (const phone of phones.slice(0, 5)) {
      info.contact.push({ kind: "phone", value: phone, evidence: [evidence.add(page.url, phone, "contact_phone")] });
    }
  }

  for (const link of links) {
    if (/mailto:/i.test(link.url)) {
      info.contact.push({ kind: "email_link", value: link.url, evidence: [evidence.add(link.pageUrl, link.url, "contact_link")] });
    }
    if (/tel:/i.test(link.url)) {
      info.contact.push({ kind: "phone_link", value: link.url, evidence: [evidence.add(link.pageUrl, link.url, "contact_link")] });
    }
    if (/cart|checkout|pay|pricing|subscribe|buy|order/i.test(`${link.anchorText} ${link.url}`)) {
      info.payment.push({ kind: "payment_or_purchase_link", value: link.url, evidence: [evidence.add(link.pageUrl, link.anchorText || link.url, "payment")] });
    }
    if (/login|log-in|signin|sign-in|account|portal/i.test(`${link.anchorText} ${link.url}`)) {
      info.auth.push({ kind: "auth_link", value: link.url, evidence: [evidence.add(link.pageUrl, link.anchorText || link.url, "auth")] });
    }
  }

  for (const page of pages) {
    for (const node of page.structuredData) {
      if (node.address) {
        const value = typeof node.address === "string" ? node.address : JSON.stringify(node.address);
        info.locations.push({
          value,
          evidence: [evidence.add(page.url, value, "structured_location")]
        });
      }
      if (node.openingHours) {
        const value = Array.isArray(node.openingHours) ? node.openingHours.join(", ") : String(node.openingHours);
        info.hours.push({
          value,
          evidence: [evidence.add(page.url, value, "structured_hours")]
        });
      }
    }

    const locationPage = /location|visit|contact|address/i.test(`${page.url} ${page.title}`);
    if (locationPage) {
      const snippets = sentenceSnippets(page.text, [/visit us/i, /located at/i, /\b\d{2,6}\s+[A-Za-z0-9 .'-]+\s+(street|st\.|avenue|ave\.|road|rd\.|boulevard|blvd\.|drive|dr\.)\b/i], 3);
      for (const snippet of snippets) {
        info.locations.push({ value: snippet, evidence: [evidence.add(page.url, snippet, "location")] });
      }
    }

    const hoursPage = /hours|location|visit|contact/i.test(`${page.url} ${page.title}`);
    if (hoursPage) {
      const snippets = sentenceSnippets(page.text, [/hours[:\s]/i, /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*\b.*\b\d{1,2}(:\d{2})?\s?(am|pm)\b/i], 3);
      for (const snippet of snippets) {
        info.hours.push({ value: snippet, evidence: [evidence.add(page.url, snippet, "hours")] });
      }
    }
  }

  return {
    contact: uniqueBy(info.contact, (item) => `${item.kind}:${item.value}`).slice(0, 12),
    payment: uniqueBy(info.payment, (item) => item.value).slice(0, 8),
    auth: uniqueBy(info.auth, (item) => item.value).slice(0, 8),
    locations: uniqueBy(info.locations, (item) => item.value).slice(0, 6),
    hours: uniqueBy(info.hours, (item) => item.value).slice(0, 6)
  };
}

function identifyMissingOrUnclear({ business, offerings, customerActions, toolsFormsLinks, visibleInfo, pages }) {
  const missing = [];

  if (business.name === "unknown") missing.push("Business name was not clearly visible in scanned HTML.");
  if (business.description === "unknown") missing.push("Business description was not clearly visible.");
  if (!offerings.length) missing.push("Products or services were not confidently identified.");
  if (!customerActions.length) missing.push("No customer actions were confidently identified.");
  if (!toolsFormsLinks.some((item) => item.type === "form")) missing.push("No HTML forms were found in scanned pages.");
  if (!visibleInfo.contact.length) missing.push("No email or phone contact information was detected.");
  if (!visibleInfo.payment.length) missing.push("Payment, checkout, or pricing flow was not proven by scanned pages.");
  if (!visibleInfo.auth.length) missing.push("Login, portal, or account access was not proven by scanned pages.");
  if (pages.length < 2) missing.push("Only one readable page was scanned, so site coverage is limited.");

  return missing;
}

function createEvidenceCollector() {
  const entries = [];
  return {
    add(url, quote, label) {
      const compactQuote = compactSnippet(quote, 280);
      const id = `ev_${String(entries.length + 1).padStart(3, "0")}`;
      entries.push({ id, label, url, quote: compactQuote });
      return id;
    },
    all() {
      return entries;
    }
  };
}

function inferBusinessTypes(pages) {
  const homepage = pages[0];
  const haystack = `${homepage.title} ${homepage.metaDescription} ${homepage.headings.slice(0, 10).join(" ")}`;
  const matches = [
    [/restaurant|dining|catering|food service|salad|grain bowl|wraps/i, "restaurant_or_food_service"],
    [/software|platform|api|saas|cloud|project management|marketing automation|email marketing/i, "software_or_technology"],
    [/law firm|attorney|legal services|lawyer/i, "legal_services"],
    [/doctor|clinic|dental|medical practice|therapy|therapist|patient care/i, "healthcare"],
    [/hotel|travel agency|guided tour|hospitality/i, "hospitality_or_travel"],
    [/ecommerce|retail|online store|shopping cart/i, "retail_or_ecommerce"],
    [/agency|consulting|consultant|marketing/i, "professional_services"],
    [/bank|loan|insurance|financial/i, "financial_services"],
    [/education|course|school|training/i, "education_or_training"]
  ];
  return matches.filter(([regex]) => regex.test(haystack)).map(([, type]) => type).slice(0, 4);
}

function inferOfferingCategory(text, page) {
  const haystack = `${text} ${page.url}`.toLowerCase();
  if (/price|plan|subscribe/.test(haystack)) return "pricing_or_plan";
  if (/menu|food|drink|catering/.test(haystack)) return "menu_item_or_food_service";
  if (/software|platform|api|app|tool/.test(haystack)) return "software_or_tool";
  if (/service|consult|support/.test(haystack)) return "service";
  if (/product|shop|store|buy/.test(haystack)) return "product";
  return "unknown";
}

function inferFormLabel(form) {
  const names = form.fields.map((field) => field.label || field.name || field.type).filter(Boolean);
  if (/search/i.test(names.join(" "))) return "Search form";
  if (/email|message|name|phone/i.test(names.join(" "))) return "Contact or lead form";
  if (/password|login|username/i.test(names.join(" "))) return "Authentication form";
  return "Website form";
}

function isNavigationNoise(text) {
  return /^(home|about|contact|privacy|terms|blog|resources|menu|search|skip to content)$/i.test(text);
}

function cleanTitle(title) {
  return title.split(/[|–-]/)[0]?.trim() || title.trim();
}

function sameUrl(a, b) {
  try {
    const one = new URL(a);
    const two = new URL(b);
    return one.origin === two.origin && one.pathname.replace(/\/$/, "") === two.pathname.replace(/\/$/, "");
  } catch {
    return a === b;
  }
}
