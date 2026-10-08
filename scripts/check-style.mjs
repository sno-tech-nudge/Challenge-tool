// Tiny style gate: no raw hex colours or border-radius in components/pages (use CSS tokens in
// src/styles/globals.css).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const bad = [];
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (['.ts', '.tsx'].includes(extname(p))) {
      readFileSync(p, 'utf8').split('\n').forEach((line, i) => {
        const code = line.replace(/\/\/.*$/, '');
        if (/#[0-9a-fA-F]{3,8}\b/.test(code)) bad.push(`${p}:${i + 1} raw hex colour`);
        if (/borderRadius/.test(code)) bad.push(`${p}:${i + 1} border radius`);
      });
    }
  }
}
walk(join(process.cwd(), 'src'));
if (bad.length) {
  console.error(bad.join('\n'));
  process.exit(1);
}
console.log('style check clean');
