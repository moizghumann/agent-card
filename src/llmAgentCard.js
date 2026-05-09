import { generateAgentCard } from "./agentCard.js";
import { callOpenRouterJson, isOpenRouterConfigured } from "./openRouter.js";

const CARD_SYSTEM_PROMPT = `You generate an AI-readable agent card from an evidence-backed business map.
Rules:
- Use only the provided businessMap.
- Do not add capabilities that are not present in customerActions or toolsFormsLinks.
- Every important claim must include source evidence copied from the map evidence IDs.
- Unknowns must remain unknown.
- Keep safe automation constraints: human approval is required for purchases, payments, account creation, form submission, and message sending.
- Return only JSON.`;

export async function generateAgentCardWithOptionalLlm(businessMap) {
  const deterministicCard = generateAgentCard(businessMap);

  if (!isOpenRouterConfigured()) {
    return { card: deterministicCard, usedLlm: false, warning: null };
  }

  try {
    const card = await callOpenRouterJson({
      system: CARD_SYSTEM_PROMPT,
      user: JSON.stringify({
        task: "Generate a machine-readable agent card from this businessMap. Preserve evidence and unknowns.",
        requiredBaselineSchema: deterministicCard,
        businessMap
      })
    });

    return {
      card: sanitizeAgentCard(card, deterministicCard, businessMap),
      usedLlm: true,
      warning: null
    };
  } catch (error) {
    return {
      card: deterministicCard,
      usedLlm: false,
      warning: `LLM agent-card generation failed; deterministic card used instead. ${error.message}`
    };
  }
}

function sanitizeAgentCard(candidate, fallback, businessMap) {
  const card = candidate && typeof candidate === "object" ? candidate : fallback;
  const allowedCapabilityIds = new Set(businessMap.customerActions.map((action) => action.action));

  card.agentCardVersion = fallback.agentCardVersion;
  card.generatedFrom = fallback.generatedFrom;
  card.businessIdentity = card.businessIdentity || fallback.businessIdentity;
  card.interactionModel = card.interactionModel || fallback.interactionModel;
  card.offerings = Array.isArray(card.offerings) ? card.offerings : fallback.offerings;
  card.operatingContext = card.operatingContext || fallback.operatingContext;
  card.unknowns = Array.isArray(card.unknowns) ? card.unknowns : fallback.unknowns;
  card.agentInstructions = card.agentInstructions || fallback.agentInstructions;
  card.sourceEvidence = businessMap.evidenceIndex;

  if (!Array.isArray(card.interactionModel.customerCapabilities)) {
    card.interactionModel.customerCapabilities = fallback.interactionModel.customerCapabilities;
  } else {
    card.interactionModel.customerCapabilities = card.interactionModel.customerCapabilities.filter((capability) =>
      allowedCapabilityIds.has(capability.id)
    );
  }

  if (!card.agentInstructions.safeAutomationPolicy) {
    card.agentInstructions.safeAutomationPolicy = fallback.agentInstructions.safeAutomationPolicy;
  }

  card.agentInstructions.safeAutomationPolicy.requiresHumanApproval = [
    "form_submission",
    "purchase",
    "account_creation",
    "payment",
    "message_send"
  ];

  return card;
}
