import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const deps = pkg.dependencies || {};

const EXCLUDE = new Set(['node_modules', '.git', 'dist', '.cache']);
const IMPORT_RE = /^\s*import\s+.*\bfrom\s+['"]([^'"]+)['"]/gm;

function jsFilesAtDepth(dir, depth) {
  if (depth === 0) return [];
  const files = [];
  for (const entry of readdirSync(dir)) {
    if (EXCLUDE.has(entry)) continue;
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...jsFilesAtDepth(full, depth - 1));
    } else if (stat.isFile() && entry.endsWith('.js')) {
      files.push(full);
    }
  }
  return files;
}

const files = jsFilesAtDepth('.', 2);
const mismatches = [];

for (const file of files) {
  const src = readFileSync(file, 'utf8');
  let m;
  IMPORT_RE.lastIndex = 0;
  while ((m = IMPORT_RE.exec(src)) !== null) {
    const spec = m[1];
    // Parse package name and version from import specifier.
    // Scoped packages: @scope/name[@version]
    // Unscoped packages: name[@version]
    let pkgName, version;
    if (spec.startsWith('@')) {
      const parts = spec.slice(1).split('@');
      pkgName = '@' + parts[0];
      version = parts[1];
    } else {
      const idx = spec.indexOf('@');
      pkgName = idx === -1 ? spec : spec.slice(0, idx);
      version = idx === -1 ? undefined : spec.slice(idx + 1);
    }

    if (!(pkgName in deps)) continue; // Not a tracked dependency; skip.

    const expected = deps[pkgName];
    if (!version) {
      mismatches.push(`${file}: '${spec}' has no version constraint (expected @${expected})`);
    } else if (version !== expected) {
      mismatches.push(`${file}: '${spec}' has version @${version} but package.json requires @${expected}`);
    }
  }
}

if (mismatches.length > 0) {
  console.error('Import version mismatches found:');
  for (const msg of mismatches) console.error(' -', msg);
  process.exit(1);
} else {
  console.log('All import version constraints match package.json.');
}
