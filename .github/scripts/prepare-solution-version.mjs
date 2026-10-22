// Compares the control version with the version in the packaged solution and
// stamps the solution version that is derived from the control version.
//
// Solution version: <major>.<minor>.<control major * 100 + control minor>.<control patch>,
// where <major>.<minor> is taken from Solution.xml (e.g. control 0.0.3 -> solution 1.1.0.3).
//
// Outputs (GITHUB_OUTPUT): control_version, packaged_version, solution_version, changed (true/false).

import { execFileSync } from "node:child_process";
import { appendFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";

const MANIFEST = "SPFileExplorer/ControlManifest.Input.xml";
const SOLUTION_XML = "Solution/SPFileExplorerSolution/src/Other/Solution.xml";
const PACKAGE_ZIP = "Solution/SPFullFileExplorer.zip";

const parseVersion = (version) => version.split(".").map((part) => parseInt(part, 10));

const compareVersions = (a, b) => {
  const [pa, pb] = [parseVersion(a), parseVersion(b)];
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return Math.sign(diff);
  }
  return 0;
};

const readControlVersion = (manifest) => {
  // A whitespace is required before "version" so that "api-version" is not matched.
  const match = /<control\s[^>]*?\sversion="([^"]+)"/.exec(manifest);
  if (!match) throw new Error("Control version is not found in the manifest.");
  return match[1];
};

const controlVersion = readControlVersion(readFileSync(MANIFEST, "utf8"));
if (!/^\d+\.\d+\.\d+$/.test(controlVersion)) {
  throw new Error(`Control version "${controlVersion}" must have the format major.minor.patch.`);
}

let packagedVersion = "";
if (existsSync(PACKAGE_ZIP)) {
  const packagedManifest = execFileSync(
    "unzip",
    ["-p", PACKAGE_ZIP, "Controls/*/ControlManifest.xml"],
    { encoding: "utf8" }
  );
  packagedVersion = readControlVersion(packagedManifest);
}

if (packagedVersion && compareVersions(controlVersion, packagedVersion) < 0) {
  throw new Error(
    `Control version ${controlVersion} is lower than the packaged version ${packagedVersion}.`
  );
}

const solutionXml = readFileSync(SOLUTION_XML, "utf8");
const solutionVersionMatch = /<Version>(\d+)\.(\d+)[^<]*<\/Version>/.exec(solutionXml);
if (!solutionVersionMatch) throw new Error("Solution version is not found in Solution.xml.");

const [controlMajor, controlMinor, controlPatch] = parseVersion(controlVersion);
const solutionVersion = [
  solutionVersionMatch[1],
  solutionVersionMatch[2],
  controlMajor * 100 + controlMinor,
  controlPatch,
].join(".");

writeFileSync(
  SOLUTION_XML,
  solutionXml.replace(solutionVersionMatch[0], `<Version>${solutionVersion}</Version>`)
);

const changed = !packagedVersion || compareVersions(controlVersion, packagedVersion) > 0;

console.log(`Control version:   ${controlVersion}`);
console.log(`Packaged version:  ${packagedVersion || "(none)"}`);
console.log(`Solution version:  ${solutionVersion}`);
console.log(`Package to update: ${changed}`);

if (process.env.GITHUB_OUTPUT) {
  appendFileSync(
    process.env.GITHUB_OUTPUT,
    [
      `control_version=${controlVersion}`,
      `packaged_version=${packagedVersion}`,
      `solution_version=${solutionVersion}`,
      `changed=${changed}`,
      "",
    ].join("\n")
  );
}
