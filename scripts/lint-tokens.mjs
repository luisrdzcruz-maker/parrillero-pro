#!/usr/bin/env node
// Slice A token-discipline lint rule.
// Bans arbitrary Tailwind values that have a ds.* token equivalent.
// Per docs/audits/slice-a-locked-values.md §8 and slice-a-token-proposal.md §8.
//
// Scope: components/**/*.tsx and app/**/*.tsx
// Exempt: lib/**, app/globals.css, node_modules/**
//
// Opt-out: a comment matching /allow-arbitrary:/ on the same line as the
// violation or the immediately preceding line. Use one of:
//   // allow-arbitrary: <reason>            (TS / non-JSX context)
//   {/* allow-arbitrary: <reason> */}        (JSX context)
//
// Exit code 1 if any unallowed violation is found.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  { name: 'text-[Npx]', re: /\btext-\[\d+px\]/, hint: 'use ds.text.* (body14/body12/body11/helper/eyebrow*)' },
  { name: 'text-[clamp(...)]', re: /\btext-\[clamp\([^)]+\)\]/, hint: 'use ds.text.* tier or extract a new ds.text.* token' },
  { name: 'rounded-[Nrem]', re: /\brounded-\[[\d.]+rem\]/, hint: 'use ds.radius.{pill,chip,row,card} or ds.radius.{sm,md,lg,xl}' },
  { name: 'rounded-[Npx]', re: /\brounded-\[\d+px\]/, hint: 'use ds.radius.*' },
  { name: 'shadow-[...]', re: /\bshadow-\[[^\]]+\]/, hint: 'use ds.shadow.{cardBase,cardLifted,emberGlowSm,emberGlowMd}' },
  { name: 'bg-white/[0.0X]', re: /\bbg-white\/\[0\.0\d+\]/, hint: 'use ds.color.muted.* for text or ds.panel.* for surfaces' },
  { name: 'text-white/<not 50|70|90>', re: /\btext-white\/(?!50\b|70\b|90\b)\d+\b/, hint: 'use ds.color.muted.{strong:90, base:70, helper:50}' },
  { name: 'text-slate-N/X', re: /\btext-slate-\d+\/\d+/, hint: 'use ds.color.muted.*' },
  { name: 'duration-[Nms]', re: /\bduration-\[\d+ms\]/, hint: 'use ds.motion.{enter,emphasis,pulse}' },
];

const OPT_OUT_RE = /allow-arbitrary:/;

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
      yield* walk(full);
    } else if (entry.isFile() && full.endsWith('.tsx')) {
      yield full;
    }
  }
}

function inScope(file) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  return rel.startsWith('components/') || rel.startsWith('app/');
}

let totalViolations = 0;
const violationsByFile = new Map();

for (const dir of ['components', 'app']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    if (!inScope(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const fileViolations = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const prev = i > 0 ? lines[i - 1] : '';

      const hits = [];
      for (const { name, re, hint } of FORBIDDEN_PATTERNS) {
        if (re.test(line)) hits.push({ name, hint });
      }
      if (hits.length === 0) continue;

      // Skip when an opt-out comment is on this line or the previous line.
      if (OPT_OUT_RE.test(line) || OPT_OUT_RE.test(prev)) continue;

      // Dedupe pattern names on one line.
      const seen = new Set();
      for (const h of hits) {
        if (seen.has(h.name)) continue;
        seen.add(h.name);
        fileViolations.push({ line: i + 1, name: h.name, hint: h.hint, snippet: line.trim().slice(0, 160) });
      }
    }

    if (fileViolations.length > 0) {
      violationsByFile.set(file, fileViolations);
      totalViolations += fileViolations.length;
    }
  }
}

if (totalViolations === 0) {
  console.log('✅ lint-tokens: 0 violations');
  process.exit(0);
}

for (const [file, vs] of violationsByFile) {
  const rel = path.relative(ROOT, file).split(path.sep).join('/');
  console.error(`\n${rel}:`);
  for (const v of vs) {
    console.error(`  ${rel}:${v.line}  [${v.name}]`);
    console.error(`    ${v.snippet}`);
    console.error(`    → ${v.hint}`);
  }
}

console.error(`\n❌ lint-tokens: ${totalViolations} violation${totalViolations === 1 ? '' : 's'} across ${violationsByFile.size} file${violationsByFile.size === 1 ? '' : 's'}`);
console.error('Opt out a single line with "// allow-arbitrary: <reason>" (TS) or "{/* allow-arbitrary: <reason> */}" (JSX).');
process.exit(1);
