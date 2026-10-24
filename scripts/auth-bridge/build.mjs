// Builds the sign-in redirect page (web resource dotact_/spfileexplorer/authredirect.html)
// that MSAL needs for the Microsoft Graph sign-in popup. The MSAL redirect bridge is bundled
// into the page, so that it is served from the Dataverse environment itself.
//
// Usage: node scripts/auth-bridge/build.mjs

import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ESBUILD = "esbuild@0.28.2";
const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const output = join(
  root,
  "Solution/SPFileExplorerSolution/src/WebResources/dotact_/spfileexplorer/authredirect.html"
);
const msalVersion = JSON.parse(
  readFileSync(join(root, "node_modules/@azure/msal-browser/package.json"), "utf8")
).version;

const script = execFileSync(
  "npx",
  [
    "--yes",
    ESBUILD,
    "scripts/auth-bridge/entry.js",
    "--bundle",
    "--minify",
    "--format=iife",
    "--platform=browser",
    "--target=es2019",
    "--legal-comments=none",
  ],
  { cwd: root, encoding: "utf8", maxBuffer: 10 * 1024 * 1024 }
)
  // The script is inlined into the page.
  .replace(/<\/script/gi, "<\\/script");

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="robots" content="noindex">
<title>Signing in</title>
</head>
<body>
<p id="message">Signing in...</p>
<!-- MSAL redirect bridge (@azure/msal-browser ${msalVersion}, MIT License, Copyright (c) Microsoft Corporation) -->
<script>${script.trim()}</script>
</body>
</html>
`;

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, html);
console.log(`Written ${output} (${html.length} bytes, MSAL ${msalVersion})`);
