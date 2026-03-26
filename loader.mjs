export async function resolve(specifier, context, defaultResolve) {
  // ---- MOCK @pipedream/platform ----
  if (specifier === "@pipedream/platform") {
    return {
      url:
        "data:text/javascript," +
        encodeURIComponent(`
        export const axios = async ($, config) => {
          globalThis.__axiosCalls = globalThis.__axiosCalls || [];
          globalThis.__axiosCalls.push(config);
          return { status: 200 };
        };
      `),
    };
  }

  // ---- Existing version-stripping logic ----
  if (specifier.includes("@")) {
    const parts = specifier.split("@");
    // If it looks like a Pipedream versioned import (e.g., 'alasql@^4')
    // and it's not a scoped package (which would start with @)
    if (parts.length === 2 && !specifier.startsWith("@")) {
      return defaultResolve(parts[0], context, defaultResolve);
    }
    // Handle scoped packages (e.g., '@scope/pkg@^1')
    if (parts.length === 3 && specifier.startsWith("@")) {
      return defaultResolve(`@${parts[1]}`, context, defaultResolve);
    }
  }

  return defaultResolve(specifier, context, defaultResolve);
}
