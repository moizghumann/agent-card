# Business Agent Card Scanner

This is a small web app that accepts a public business URL, scans same-site HTML pages, builds an
evidence-backed business map, and generates a machine-readable agent card from that map.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`, enter a public business URL, and click **Analyze**.

## Local Development

Run `npm run setup` when preparing a fresh checkout. Before handing off changes, run `npm run validate`. Future agents should read `AGENTS.md` for repository-specific instructions before editing.

## OpenRouter

The app can use OpenRouter to refine the business map and generate the agent card more
intelligently, while still requiring evidence IDs for claims.

Create a local `.env` file:

```bash
OPENROUTER_API_KEY=sk-or-v1-your-key-here
OPENROUTER_MODEL=openai/gpt-4.1-mini
```

`.env` is ignored by git. If no key is present, the app uses the deterministic scanner and card
generator.

## CLI

```bash
npm run analyze -- https://basecamp.com
```

## Example Outputs

The repo includes three generated examples in `examples/`:

- `basecamp.json`
- `mailchimp.json`
- `sweetgreen.json`

Regenerate them with:

```bash
npm run generate:examples
```

## What The App Produces

The result has two layers:

- **Business map:** pages found, business identity, offerings, possible customer actions,
  forms/tools/links, visible contact/payment/auth signals, missing or unclear information, and
  source evidence.
- **Agent card:** a downstream-agent-friendly JSON document derived from the business map,
  including capabilities, constraints, unknowns, and safe automation policy.

The scanner does not claim facts unless the site provides evidence. Missing details are marked
unknown or listed under `missingOrUnclear`.

## Agent / Harness Notes

Future agents should start with `AGENTS.md`. For a safe local validation pass, run:

```bash
npm run validate
```
