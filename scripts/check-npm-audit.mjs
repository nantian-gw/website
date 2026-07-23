import { execFileSync } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const allowedHighs = new Map([
  ["@astrojs/mdx", ["astro"]],
  ["@astrojs/starlight", ["@astrojs/mdx", "astro", "astro-expressive-code"]],
  ["astro", ["astro", "esbuild", "sharp"]],
  ["astro-expressive-code", ["astro"]],
  ["esbuild", ["esbuild"]],
  ["sharp", ["sharp"]],
  ["starlight-versions", ["@astrojs/starlight"]],
  ["vite", ["esbuild"]],
]);

function normalizeVia(via = []) {
  return [...new Set(via.map((entry) => (typeof entry === "string" ? entry : entry?.name)).filter(Boolean))].sort();
}

function sameMembers(left, right) {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

export function classifyAuditReport(report) {
  const actionable = [];

  for (const [name, vulnerability] of Object.entries(report.vulnerabilities ?? {})) {
    const severity = vulnerability.severity ?? "info";
    if (severity !== "high" && severity !== "critical") continue;

    if (severity === "critical") {
      actionable.push({
        name,
        severity,
        fixAvailable: vulnerability.fixAvailable ?? null,
      });
      continue;
    }

    const expectedVia = allowedHighs.get(name);
    const actualVia = normalizeVia(vulnerability.via);
    const knownUnfixable =
      (vulnerability.fixAvailable === false || vulnerability.fixAvailable?.isSemVerMajor === true) &&
      expectedVia &&
      sameMembers(actualVia, [...expectedVia].sort());

    if (!knownUnfixable) {
      actionable.push({
        name,
        severity,
        fixAvailable: vulnerability.fixAvailable ?? null,
      });
    }
  }

  return { actionable };
}

export function runAudit() {
  try {
    return JSON.parse(
      execFileSync(npmCommand, ["audit", "--audit-level=high", "--json"], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      }),
    );
  } catch (error) {
    const stdout = typeof error?.stdout === "string" ? error.stdout : error?.stdout?.toString?.() ?? "";
    if (stdout.trim().startsWith("{")) {
      return JSON.parse(stdout);
    }

    const stderr = typeof error?.stderr === "string" ? error.stderr : error?.stderr?.toString?.() ?? "";
    throw new Error(`npm audit failed before producing JSON output.\n${stderr || stdout}`.trim(), { cause: error });
  }
}

export function main() {
  const report = runAudit();
  const { actionable } = classifyAuditReport(report);

  if (actionable.length > 0) {
    console.error(JSON.stringify(actionable, null, 2));
    process.exitCode = 1;
    return;
  }

  console.log("No actionable high or critical npm audit findings.");
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
