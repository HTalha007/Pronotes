#!/usr/bin/env node
/**
 * Architecture guard for the Clean Architecture "dependency rule".
 * Fails (exit 1) when the domain layer breaks its purity rules:
 *   1. imports only relative paths that stay INSIDE packages/core/src/domain
 *      (no npm packages, no other layers, no other workspace packages)
 *   2. uses no browser/runtime globals (window, indexedDB, fetch, crypto.subtle...)
 *   3. uses no `any`
 *   4. file names are kebab-case
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const domainRoot = join(root, 'packages', 'core', 'src', 'domain');

const FORBIDDEN_GLOBALS = [
  'window',
  'document',
  'navigator',
  'indexedDB',
  'localStorage',
  'sessionStorage',
  'fetch',
  'XMLHttpRequest',
  'WebSocket',
  'Worker',
  'btoa',
  'atob',
  'crypto',
];
const KEBAB_FILE = /^[a-z0-9]+(-[a-z0-9]+)*\.ts$/;

function listFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? listFiles(full) : [full];
  });
}

function stripCommentsAndStrings(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

const violations = [];
const report = (file, message) => violations.push(`${relative(root, file)}: ${message}`);

for (const file of listFiles(domainRoot)) {
  const name = file.split(sep).pop();
  if (!KEBAB_FILE.test(name)) {
    report(file, `file name "${name}" must be kebab-case .ts`);
  }

  const raw = readFileSync(file, 'utf8');

  for (const match of raw.matchAll(/(?:from|import)\s+['"]([^'"]+)['"]/g)) {
    const specifier = match[1];
    if (!specifier.startsWith('.')) {
      report(file, `forbidden import "${specifier}" (domain must not depend on packages/frameworks)`);
      continue;
    }
    const target = resolve(dirname(file), specifier);
    if (target !== domainRoot && !target.startsWith(domainRoot + sep)) {
      report(file, `import "${specifier}" escapes the domain layer`);
    }
  }

  const code = stripCommentsAndStrings(raw);
  for (const global of FORBIDDEN_GLOBALS) {
    if (new RegExp(`(?<![\\w.$])${global}(?![\\w$])`).test(code)) {
      report(file, `forbidden global "${global}" (environment access belongs to infrastructure)`);
    }
  }
  if (/:\s*any\b|\bas\s+any\b|<any>|\bany\[\]/.test(code)) {
    report(file, '`any` is forbidden; use `unknown` with a type guard');
  }
}

if (violations.length > 0) {
  console.error('Architecture check FAILED:\n' + violations.map((v) => `  - ${v}`).join('\n'));
  process.exit(1);
}
console.log(`Architecture check passed (${listFiles(domainRoot).length} domain files).`);
