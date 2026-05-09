import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const exampleFiles = ["examples/basecamp.json", "examples/mailchimp.json", "examples/sweetgreen.json"];
const businessMapSchema = JSON.parse(fs.readFileSync("schemas/business-map.schema.json", "utf8"));
const agentCardSchema = JSON.parse(fs.readFileSync("schemas/agent-card.schema.json", "utf8"));

test("example outputs match required schema shape", () => {
  for (const file of exampleFiles) {
    const output = JSON.parse(fs.readFileSync(file, "utf8"));
    validateRequiredShape(output.businessMap, businessMapSchema, `${file}.businessMap`);
    validateRequiredShape(output.agentCard, agentCardSchema, `${file}.agentCard`);
    assert.ok(output.businessMap.evidenceIndex.length > 0, `${file} should include evidence`);
    assert.ok(output.agentCard.sourceEvidence.length > 0, `${file} should include source evidence`);
  }
});

test("example agent cards are generated from their business maps", () => {
  for (const file of exampleFiles) {
    const output = JSON.parse(fs.readFileSync(file, "utf8"));
    assert.equal(output.agentCard.generatedFrom.businessMapVersion, output.businessMap.mapVersion);
    assert.equal(output.agentCard.generatedFrom.startUrl, output.businessMap.scope.startUrl);
    assert.equal(output.agentCard.generatedFrom.pagesScanned, output.businessMap.scope.pagesScanned);
  }
});

function validateRequiredShape(value, schema, path) {
  assert.equal(typeof value, "object", `${path} should be an object`);
  for (const key of schema.required || []) {
    assert.ok(Object.hasOwn(value, key), `${path} missing required key ${key}`);
  }

  for (const [key, childSchema] of Object.entries(schema.properties || {})) {
    if (!Object.hasOwn(value, key)) continue;
    const child = value[key];
    if (childSchema.type === "array") {
      assert.ok(Array.isArray(child), `${path}.${key} should be an array`);
    }
    if (childSchema.type === "object") {
      assert.equal(typeof child, "object", `${path}.${key} should be an object`);
      validateRequiredShape(child, childSchema, `${path}.${key}`);
    }
  }
}

