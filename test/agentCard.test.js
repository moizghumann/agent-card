import test from "node:test";
import assert from "node:assert/strict";
import { generateAgentCard } from "../src/agentCard.js";

test("generateAgentCard derives capabilities and evidence from the business map", () => {
  const map = {
    mapVersion: "1.0",
    scope: { startUrl: "https://example.com", pagesScanned: 1 },
    business: {
      name: "Example Co",
      description: "Example description",
      likelyTypes: ["software_or_technology"],
      confidence: "medium",
      evidence: ["ev_001"]
    },
    customerActions: [
      {
        action: "contact_business",
        label: "Contact the business",
        targetUrl: "https://example.com/contact",
        mechanism: "link",
        evidence: ["ev_002"]
      }
    ],
    toolsFormsLinks: [],
    visibleInfo: { contact: [], payment: [], auth: [], locations: [], hours: [] },
    offerings: [],
    missingOrUnclear: ["Business hours were not found."],
    evidenceIndex: [
      { id: "ev_001", label: "business_name", url: "https://example.com", quote: "Example Co" },
      { id: "ev_002", label: "customer_action:contact_business", url: "https://example.com", quote: "Contact" }
    ]
  };

  const card = generateAgentCard(map);

  assert.equal(card.businessIdentity.name, "Example Co");
  assert.equal(card.interactionModel.customerCapabilities.length, 1);
  assert.equal(card.interactionModel.customerCapabilities[0].id, "contact_business");
  assert.deepEqual(card.unknowns, ["Business hours were not found."]);
  assert.equal(card.sourceEvidence.length, 2);
});

