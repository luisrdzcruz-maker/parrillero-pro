#!/usr/bin/env node
// Slice A — one-shot amnesty pass.
// Inserts `{/* allow-arbitrary: pre-slice-a */}` on the line immediately
// before every existing violation in components/**/*.tsx and app/**/*.tsx,
// so the lint rule (scripts/lint-tokens.mjs) doesn't fail CI on day one.
//
// Every marker is a parole. Slices B/D should remove the marker and
// migrate the underlying value to a ds.* token when they touch the line.
//
// This script is idempotent — re-running it does nothing if the marker
// is already on the previous line.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const FORBIDDEN_PATTERNS = [
  /\btext-\[\d+px\]/,
  /\btext-\[clamp\([^)]+\)\]/,
  /\brounded-\[[\d.]+rem\]/,
  /\brounded-\[\d+px\]/,
  /\bshadow-\[[^\]]+\]/,
  /\bbg-white\/\[0\.0\d+\]/,
  /\btext-white\/(?!50\b|70\b|90\b)\d+\b/,
  /\btext-slate-\d+\/\d+/,
  /\bduration-\[\d+ms\]/,
];
const OPT_OUT_RE = /allow-arbitrary:/;
const MARKER = 'allow-arbitrary: pre-slice-a';

function isViolation(line) {
  return FORBIDDEN_PATTERNS.some((re) => re.test(line));
}

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

let filesTouched = 0;
let markersAdded = 0;
const breakingFiles = [];

for (const dir of ['components', 'app']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const file of walk(abs)) {
    const content = fs.readFileSync(file, 'utf8');
    const lines = content.split(/\r?\n/);
    const out = [];
    let added = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const viol = isViolation(line);
      const sameLineOptOut = OPT_OUT_RE.test(line);
      const prevOutLineOptOut = out.length > 0 && OPT_OUT_RE.test(out[out.length - 1]);

      if (viol && !sameLineOptOut && !prevOutLineOptOut) {
        const indent = line.match(/^\s*/)[0];
        // Context-aware comment form:
        //   `{/* */}`  — valid as JSX-children content (sibling expression)
        //   `/* */`    — block comment, valid in TS/JS but renders as TEXT
        //                if inside JSX children
        //
        // Pick based on the nearest non-blank line that precedes the
        // violation. Blank lines hide JSX context; we look past them.
        let prev = '';
        for (let j = out.length - 1; j >= 0; j--) {
          const candidate = out[j].trim();
          if (candidate !== '') {
            prev = candidate;
            break;
          }
        }
        const stripped = line.trimStart();
        const startsWithJsxOpener = stripped.startsWith('<');

        // Previous line ending in an expression-position introducer means
        // we're NOT in JSX-children yet (we're at expression position e.g.
        // `return (`, `cond ?`, `: `, `=>`, `[`, `{` of object literal).
        // In all of these, a block comment is safe; a `{/* */}` would
        // create a stray empty object/expression.
        const isExprPosition = /[\(\[\{=,?:]$/.test(prev) || /=>$/.test(prev);

        // We're confidently inside JSX-children only when the previous
        // line is JSX (ends with `>` of a tag, or `}` closing a JSX
        // expression embedded among children) AND the current line opens
        // a sibling JSX element.
        const isJsxChildren =
          !isExprPosition &&
          startsWithJsxOpener &&
          (/>$/.test(prev) || /\}$/.test(prev));

        const marker = isJsxChildren
          ? `${indent}{/* ${MARKER} */}`
          : `${indent}/* ${MARKER} */`;
        out.push(marker);
        added++;
      }
      out.push(line);
    }

    if (added > 0) {
      const newContent = out.join('\n');
      fs.writeFileSync(file, newContent, 'utf8');
      filesTouched++;
      markersAdded += added;
    }
  }
}

console.log(`amnesty: added ${markersAdded} markers across ${filesTouched} files`);

if (breakingFiles.length > 0) {
  console.log('Files needing manual review:');
  for (const f of breakingFiles) console.log('  ' + f);
}
