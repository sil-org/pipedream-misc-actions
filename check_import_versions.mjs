import { readFileSync, readdirSync, statSync } from 'fs';
import { isBuiltin } from 'node:module';

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const deps = pkg.dependencies || {};

const IMPORT_RE = /^\s*import\s+.*\bfrom\s+['"]([^'"]+)['"]/gm;

const files = readdirSync('.')
  .filter(entry => entry.endsWith('.js') && !entry.endsWith('.test.js'))
  .filter(entry => statSync(entry).isFile());

const mismatches = [];

for (const file of files) {
  const source = readFileSync(file, 'utf8');
  let match;
  IMPORT_RE.lastIndex = 0;
  while ((match = IMPORT_RE.exec(source)) !== null) {
    const importSpecifier = match[1];
    // Parse package name and version from import specifier.
    // Scoped packages: @scope/name[@version]
    // Unscoped packages: name[@version]
    let pkgName, version;
    if (importSpecifier.startsWith('@')) {
      const scopedParts = importSpecifier.slice(1).split('@');
      pkgName = '@' + scopedParts[0];
      version = scopedParts[1];
    } else {
      const idx = importSpecifier.indexOf('@');
      pkgName = idx === -1 ? importSpecifier : importSpecifier.slice(0, idx);
      version = idx === -1 ? undefined : importSpecifier.slice(idx + 1);
    }

    if (!(pkgName in deps)) {
      if (!isBuiltin(pkgName)) {
        mismatches.push(`${file}: Please run 'npm install "${importSpecifier}"' to add that dependency to package.json`);
      }
      continue;
    }

    const expected = deps[pkgName];
    if (!version) {
      mismatches.push(`${file}: '${importSpecifier}' has no version constraint (expected @${expected})`);
    } else if (version !== expected) {
      mismatches.push(`${file}: '${importSpecifier}' has version @${version} but package.json uses @${expected}`);
    }
  }
}

if (mismatches.length > 0) {
  console.error('Import version mismatches found:');
  for (const mismatch of mismatches) {
    console.error(' -', mismatch);
  }
  process.exit(1);
} else {
  console.log('All import version constraints match package.json.');
}
