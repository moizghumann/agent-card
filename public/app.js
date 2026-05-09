const form = document.querySelector("#scan-form");
const input = document.querySelector("#url-input");
const button = document.querySelector("#analyze-button");
const statusBox = document.querySelector("#status");
const results = document.querySelector("#results");
const businessTitle = document.querySelector("#business-title");
const businessMapEl = document.querySelector("#business-map");
const agentCardEl = document.querySelector("#agent-card");
const copyButton = document.querySelector("#copy-card");
const mapCount = document.querySelector("#map-count");
const cardCount = document.querySelector("#card-count");

let latestAgentCard = null;

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  await analyze(input.value);
});

copyButton.addEventListener("click", async () => {
  if (!latestAgentCard) return;
  await navigator.clipboard.writeText(JSON.stringify(latestAgentCard, null, 2));
  copyButton.textContent = "Copied";
  setTimeout(() => {
    copyButton.textContent = "Copy agent card JSON";
  }, 1200);
});

async function analyze(url) {
  setLoading(true);
  showStatus("Scanning public pages and extracting evidence...");
  results.hidden = true;

  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, options: { maxPages: 8 } })
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error?.message || "Analysis failed");

    latestAgentCard = payload.agentCard;
    renderResults(payload);
    hideStatus();
  } catch (error) {
    showStatus(error.message, true);
  } finally {
    setLoading(false);
  }
}

function renderResults(payload) {
  const map = payload.businessMap;
  const card = payload.agentCard;

  businessTitle.textContent = map.business.name === "unknown" ? "Business map and agent card" : map.business.name;
  mapCount.textContent = `${map.scope.pagesScanned} pages scanned`;
  cardCount.textContent = `${card.interactionModel.customerCapabilities.length} capabilities`;
  businessMapEl.innerHTML = "";

  businessMapEl.append(
    section("Generation", [
      item("Pipeline", [
        `Business map: ${payload.scan.usedLlmForBusinessMap ? "OpenRouter refined" : "deterministic"}`,
        `Agent card: ${payload.scan.usedLlmForAgentCard ? "OpenRouter generated" : "deterministic"}`,
        payload.scan.warnings.length ? `Warnings: ${payload.scan.warnings.map((warning) => warning.message).join(" ")}` : "Warnings: none"
      ])
    ]),
    section("Business", [
      item(map.business.name, [
        map.business.description,
        `Types: ${map.business.likelyTypes.join(", ")}`,
        `Confidence: ${map.business.confidence}`
      ], evidenceFor(map.business.evidence, map))
    ]),
    section("Pages Found", map.pagesFound.slice(0, 14).map((page) =>
      item(page.anchorText || page.title || page.url, [
        page.url,
        page.scanned ? "Scanned" : "Discovered only"
      ])
    )),
    section("Products / Services", fallbackItems(map.offerings.map((offering) =>
      item(offering.name, [`Category: ${offering.category}`], evidenceFor(offering.evidence, map))
    ))),
    section("Customer Actions", fallbackItems(map.customerActions.map((action) =>
      item(action.label, [
        `Mechanism: ${action.mechanism}`,
        `Target: ${action.targetUrl}`,
        `Confidence: ${action.confidence}`
      ], evidenceFor(action.evidence, map))
    ))),
    section("Tools / Forms / Links", fallbackItems(map.toolsFormsLinks.slice(0, 18).map((tool) =>
      item(tool.label, [
        `Type: ${tool.type}`,
        tool.url ? `URL: ${tool.url}` : "",
        tool.method ? `Method: ${tool.method}` : "",
        tool.fields?.length ? `Fields: ${tool.fields.map((field) => field.label || field.name || field.type).join(", ")}` : ""
      ].filter(Boolean), evidenceFor(tool.evidence, map))
    ))),
    section("Visible Contact / Payment / Auth", [
      item("Contact", map.visibleInfo.contact.length ? map.visibleInfo.contact.map((entry) => `${entry.kind}: ${entry.value}`) : ["unknown"]),
      item("Payment", map.visibleInfo.payment.length ? map.visibleInfo.payment.map((entry) => entry.value) : ["unknown"]),
      item("Auth", map.visibleInfo.auth.length ? map.visibleInfo.auth.map((entry) => entry.value) : ["unknown"])
    ]),
    section("Missing Or Unclear", map.missingOrUnclear.map((entry) => item(entry)))
  );

  agentCardEl.textContent = JSON.stringify(card, null, 2);
  results.hidden = false;
}

function section(title, children) {
  const wrapper = document.createElement("section");
  wrapper.className = "section";
  const heading = document.createElement("div");
  heading.className = "section-title";
  heading.textContent = title;
  const list = document.createElement("ul");
  list.className = "item-list";
  for (const child of children) list.append(child);
  wrapper.append(heading, list);
  return wrapper;
}

function item(title, metaLines = [], evidenceLines = []) {
  const li = document.createElement("li");
  li.className = "item";
  const strong = document.createElement("strong");
  strong.textContent = title || "unknown";
  li.append(strong);

  for (const line of metaLines.filter(Boolean)) {
    const div = document.createElement("div");
    div.className = "meta";
    div.textContent = line;
    li.append(div);
  }

  for (const line of evidenceLines) {
    const div = document.createElement("div");
    div.className = "evidence";
    div.textContent = line;
    li.append(div);
  }

  return li;
}

function fallbackItems(items) {
  return items.length ? items : [item("unknown", ["No evidence found in scanned pages."])];
}

function evidenceFor(ids = [], map) {
  const evidenceById = new Map(map.evidenceIndex.map((entry) => [entry.id, entry]));
  return ids
    .map((id) => evidenceById.get(id))
    .filter(Boolean)
    .map((entry) => `Evidence: "${entry.quote}" (${entry.url})`);
}

function setLoading(isLoading) {
  button.disabled = isLoading;
  button.textContent = isLoading ? "Analyzing..." : "Analyze";
}

function showStatus(message, isError = false) {
  statusBox.hidden = false;
  statusBox.classList.toggle("error", isError);
  statusBox.textContent = message;
}

function hideStatus() {
  statusBox.hidden = true;
  statusBox.classList.remove("error");
}
