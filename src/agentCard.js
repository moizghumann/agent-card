export function generateAgentCard(businessMap) {
  const evidenceById = new Map(businessMap.evidenceIndex.map((item) => [item.id, item]));
  const readableEvidence = (ids = []) =>
    ids
      .map((id) => evidenceById.get(id))
      .filter(Boolean)
      .map((item) => ({
        source: item.url,
        quote: item.quote
      }));

  const capabilities = businessMap.customerActions.map((action) => ({
    id: action.action,
    label: action.label,
    status: "available_from_site_evidence",
    interactionType: action.mechanism,
    targetUrl: action.targetUrl,
    evidence: readableEvidence(action.evidence)
  }));

  const constraints = [
    "Use only capabilities marked available_from_site_evidence.",
    "Treat missing, unclear, or unevidenced details as unknown.",
    "Do not submit forms, create accounts, make purchases, or send messages without explicit user confirmation.",
    "When citing facts to a downstream agent or user, include the source URL from evidence."
  ];

  return {
    agentCardVersion: "1.0",
    generatedFrom: {
      businessMapVersion: businessMap.mapVersion,
      startUrl: businessMap.scope.startUrl,
      pagesScanned: businessMap.scope.pagesScanned
    },
    businessIdentity: {
      name: businessMap.business.name,
      description: businessMap.business.description,
      likelyTypes: businessMap.business.likelyTypes,
      confidence: businessMap.business.confidence,
      evidence: readableEvidence(businessMap.business.evidence)
    },
    interactionModel: {
      primaryWebsite: businessMap.scope.startUrl,
      customerCapabilities: capabilities,
      knownTools: businessMap.toolsFormsLinks.map((tool) => ({
        type: tool.type,
        label: tool.label,
        url: tool.url,
        method: tool.method || null,
        fields: tool.fields || null,
        external: Boolean(tool.external),
        evidence: readableEvidence(tool.evidence)
      })),
      contactChannels: businessMap.visibleInfo.contact.map((item) => ({
        kind: item.kind,
        value: item.value,
        evidence: readableEvidence(item.evidence)
      })),
      paymentOrPurchaseSignals: businessMap.visibleInfo.payment.map((item) => ({
        kind: item.kind,
        value: item.value,
        evidence: readableEvidence(item.evidence)
      })),
      authSignals: businessMap.visibleInfo.auth.map((item) => ({
        kind: item.kind,
        value: item.value,
        evidence: readableEvidence(item.evidence)
      }))
    },
    offerings: businessMap.offerings.map((offering) => ({
      name: offering.name,
      category: offering.category,
      evidence: readableEvidence(offering.evidence)
    })),
    operatingContext: {
      locations: businessMap.visibleInfo.locations.map((item) => ({
        value: item.value,
        evidence: readableEvidence(item.evidence)
      })),
      hours: businessMap.visibleInfo.hours.map((item) => ({
        value: item.value,
        evidence: readableEvidence(item.evidence)
      }))
    },
    unknowns: businessMap.missingOrUnclear,
    agentInstructions: {
      constraints,
      recommendedNextQuestions: nextQuestions(businessMap),
      safeAutomationPolicy: {
        canReadPublicPages: true,
        canPrepareDrafts: true,
        canNavigateToLinks: true,
        requiresHumanApproval: ["form_submission", "purchase", "account_creation", "payment", "message_send"],
        prohibitedWithoutMoreEvidence: businessMap.missingOrUnclear
      }
    },
    sourceEvidence: businessMap.evidenceIndex
  };
}

function nextQuestions(businessMap) {
  const questions = [];
  if (!businessMap.visibleInfo.contact.length) questions.push("What is the best verified contact channel?");
  if (!businessMap.visibleInfo.payment.length) questions.push("Does the business support online purchase, checkout, donation, or payment?");
  if (!businessMap.visibleInfo.auth.length) questions.push("Is there an account portal or login flow an agent should know about?");
  if (!businessMap.visibleInfo.hours.length) questions.push("Are business hours or response times published elsewhere?");
  if (!businessMap.offerings.length) questions.push("Which products or services should be considered primary?");
  return questions.slice(0, 6);
}
