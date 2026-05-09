const DEFAULT_PROTOCOL = "https://";

export function normalizeStartUrl(input) {
  if (!input || typeof input !== "string") {
    throw httpError("Enter a public business URL.", 400, "INVALID_URL");
  }

  const trimmed = input.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `${DEFAULT_PROTOCOL}${trimmed}`;
  let parsed;

  try {
    parsed = new URL(withProtocol);
  } catch {
    throw httpError("Enter a valid public business URL.", 400, "INVALID_URL");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw httpError("Only http and https URLs can be scanned.", 400, "UNSUPPORTED_PROTOCOL");
  }

  if (isPrivateHost(parsed.hostname)) {
    throw httpError("Only public business URLs can be scanned.", 400, "PRIVATE_HOST_BLOCKED");
  }

  parsed.hash = "";
  return parsed.toString();
}

export function normalizeDiscoveredUrl(rawHref, baseUrl) {
  if (!rawHref || rawHref.startsWith("#") || rawHref.startsWith("mailto:") || rawHref.startsWith("tel:")) {
    return null;
  }

  try {
    const url = new URL(rawHref, baseUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

export function isSameSite(candidate, startUrl) {
  const a = new URL(candidate);
  const b = new URL(startUrl);
  return stripWww(a.hostname) === stripWww(b.hostname);
}

export function httpError(message, statusCode = 500, code = "ERROR") {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  return error;
}

function stripWww(hostname) {
  return hostname.toLowerCase().replace(/^www\./, "");
}

function isPrivateHost(hostname) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || host.endsWith(".localhost")) return true;
  if (/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
    const parts = host.split(".").map(Number);
    return (
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 169 && parts[1] === 254) ||
      parts[0] === 0
    );
  }
  return false;
}
