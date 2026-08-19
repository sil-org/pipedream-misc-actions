import { readFileSync, readdirSync, statSync } from 'fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const deps = pkg.dependencies || {};

const IMPORT_RE = /^\s*import\s+.*\bfrom\s+['"]([^'"]+)['"]/gm;

const files = readdirSync('.')
  .filter(entry => entry.endsWith('.js') && !entry.endsWith('.test.js'))
  .filter(entry => statSync(entry).isFile());

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
