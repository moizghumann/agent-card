#!/usr/bin/env node
import fs from 'node:fs';

const failures = [];
const warnings = [];

function fail(message) {
  failures.push(message);
}

function warn(message) {
  warnings.push(message);
}

function read(file) {
  try {
    return fs.readFileSync(file, 'utf8');
  } catch {
    fail(`Missing required file: ${file}`);
    return '';
  }
}

function lineCount(text) {
  return text.trimEnd().split('\n').length;
}

const agents = read('AGENTS.md');
const workflow = read('WORKFLOW.md');
const packageJsonText = read('package.json');

for (const file of [
  'README.md',
  'ARCHITECTURE.md',
  'docs/index.md',
  'docs/PRODUCT.md',
  'docs/QUALITY.md',
  'docs/HARNESS.md',
  'server.js',
  'public/index.html',
  'src/analyzeBusinessUrl.js'
]) {
  read(file);
}

if (agents && lineCount(agents) > 70) {
  fail(`AGENTS.md is ${lineCount(agents)} lines; keep it as a map under 70 lines.`);
}

if (workflow && lineCount(workflow) > 120) {
  fail(`WORKFLOW.md is ${lineCount(workflow)} lines; keep the active Symphony prompt under 120 lines.`);
}

if (agents && !agents.includes('docs/HARNESS.md')) {
  fail('AGENTS.md must point agents to docs/HARNESS.md.');
}

if (workflow) {
  const requiredFragments = [
    'agent-card-workspaces',
    'git clone git@github-personal:moizghumann/agent-card.git .',
    'approval_policy: never',
    'thread_sandbox: workspace-write',
    'type: workspaceWrite',
    'max_concurrent_agents: 1',
    'max_turns: 4',
    'Do not read large generated files unless required',
    'npm run validate',
    'For documentation-only tickets:',
    'Do not commit, push, or open a PR unless the ticket explicitly asks.',
    'For code tickets:',
    'open a draft PR'
  ];
  for (const fragment of requiredFragments) {
    if (!workflow.includes(fragment)) {
      fail(`WORKFLOW.md missing expected harness fragment: ${fragment}`);
    }
  }
}

let packageJson = {};
try {
  packageJson = JSON.parse(packageJsonText);
} catch (error) {
  fail(`package.json is not valid JSON: ${error.message}`);
}

const scripts = packageJson.scripts || {};
for (const script of ['setup', 'dev', 'test', 'lint', 'typecheck', 'build', 'validate', 'healthcheck', 'harness']) {
  if (!scripts[script]) {
    fail(`package.json missing script: ${script}`);
  }
}

if (packageJson.type !== 'module') {
  fail('package.json must keep type=module for the current ESM app.');
}

const gitignore = read('.gitignore');
if (gitignore && !gitignore.includes('AGE-*/')) {
  warn('.gitignore should ignore AGE-*/ nested workspaces to avoid accidental commits.');
}

for (const message of warnings) {
  console.warn(`WARN ${message}`);
}

if (failures.length > 0) {
  for (const message of failures) {
    console.error(`FAIL ${message}`);
  }
  process.exit(1);
}

console.log('Harness contract passed.');
