import test from "node:test";
import assert from "node:assert/strict";
import { isSameSite, normalizeDiscoveredUrl, normalizeStartUrl } from "../src/url.js";

test("normalizeStartUrl adds https and strips hash", () => {
  assert.equal(normalizeStartUrl("example.com/path#section"), "https://example.com/path");
});

test("normalizeStartUrl rejects private hosts", () => {
  assert.throws(() => normalizeStartUrl("http://localhost:3000"), /public business URL/);
  assert.throws(() => normalizeStartUrl("http://192.168.0.1"), /public business URL/);
});

test("normalizeDiscoveredUrl resolves relative links and skips non-page actions", () => {
  assert.equal(normalizeDiscoveredUrl("/contact#team", "https://example.com"), "https://example.com/contact");
  assert.equal(normalizeDiscoveredUrl("mailto:test@example.com", "https://example.com"), null);
  assert.equal(normalizeDiscoveredUrl("tel:+18005551212", "https://example.com"), null);
});

test("isSameSite treats www as equivalent", () => {
  assert.equal(isSameSite("https://www.example.com/about", "https://example.com"), true);
  assert.equal(isSameSite("https://other.example.com/about", "https://example.com"), false);
});

