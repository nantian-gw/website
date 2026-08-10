import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import test from "node:test";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const astroBinPath = fileURLToPath(new URL("./node_modules/astro/bin/astro.mjs", root));

const BASE_URL = "http://localhost:4324";

// ── Page inventory ──────────────────────────────────────────────────────────

const TEST_PAGES = [
  { path: "/", label: "Homepage (EN)" },
  { path: "/about/", label: "About page (EN)" },
  { path: "/zh/about/", label: "About page (ZH)" },
  { path: "/concepts/", label: "Docs: Concepts (EN)" },
  { path: "/zh/concepts/", label: "Docs: Concepts (ZH)" },
  { path: "/features/", label: "Features index" },
  { path: "/features/ai-gateway/", label: "AI Gateway features" },
  { path: "/guides/", label: "Guides index" },
  { path: "/getting-started/", label: "Getting started" },
  { path: "/blog/why-ai-gateway/", label: "Blog post" },
  { path: "/installation/", label: "Installation docs" },
  { path: "/api-reference/", label: "API reference" },
  { path: "/nonexistent-page/", label: "404 page" },
];

// ── Helpers ─────────────────────────────────────────────────────────────────

let buildDone = false;
let serverProcess = null;

function build() {
  if (buildDone) return;
  const distIndex = new URL("dist/index.html", root);
  const distExists = existsSync(distIndex);

  if (distExists) {
    buildDone = true;
    return;
  }

  execFileSync(process.execPath, [astroBinPath, "build"], {
    cwd: rootPath,
    stdio: "pipe",
  });
  buildDone = true;
}

function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn(process.execPath, [astroBinPath, "preview", "--port", "4324", "--host", "0.0.0.0"], {
      cwd: rootPath,
      stdio: "pipe",
    });

    let started = false;
    const timeout = setTimeout(() => {
      if (!started) {
        reject(new Error("Server did not start within 30s"));
      }
    }, 30000);

    serverProcess.stdout.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Server running") || text.includes("localhost") || text.includes("127.0.0.1")) {
        started = true;
        clearTimeout(timeout);
        // Give it a moment to be fully ready
        setTimeout(() => resolve(), 1000);
      }
    });

    serverProcess.stderr.on("data", (data) => {
      const text = data.toString();
      if (text.includes("Server running") || text.includes("localhost") || text.includes("127.0.0.1")) {
        started = true;
        clearTimeout(timeout);
        setTimeout(() => resolve(), 1000);
      }
    });

    serverProcess.on("error", (err) => {
      clearTimeout(timeout);
      reject(err);
    });

    serverProcess.on("exit", (code) => {
      clearTimeout(timeout);
      if (!started) {
        reject(new Error(`Server exited with code ${code} before starting`));
      }
    });
  });
}

function stopServer() {
  return new Promise((resolve) => {
    if (!serverProcess) {
      resolve();
      return;
    }
    serverProcess.on("close", () => {
      serverProcess = null;
      resolve();
    });
    serverProcess.kill("SIGTERM");
    // Force kill after 5s
    setTimeout(() => {
      if (serverProcess) {
        serverProcess.kill("SIGKILL");
        serverProcess = null;
      }
      resolve();
    }, 5000);
  });
}

// ── Tests ───────────────────────────────────────────────────────────────────

test("WCAG 2.2 AA compliance: no critical or serious violations on key pages", async (t) => {
  // Build the site
  build();

  // Start the preview server
  await startServer();

  try {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      locale: "en-US",
    });

    // We need to dynamically import axe-core source
    // @axe-core/playwright provides the AxeBuilder class
    const { default: AxeBuilder } = await import("@axe-core/playwright");

    const allResults = [];

    for (const { path, label } of TEST_PAGES) {
      await t.test(label, async (_st) => {
        const url = `${BASE_URL}${path}`;
        const page = await context.newPage();

        try {
          await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

          // Run axe-core analysis with WCAG 2.2 AA ruleset
          const builder = new AxeBuilder({ page })
            .withTags(["wcag2aa", "wcag21aa", "wcag22aa"])
            .options({
              rules: {
                // Exclude color-contrast for now since Starlight has dark/light modes
                // that may fail on synthetic test pages
                "color-contrast": { enabled: true },
              },
            });

          const results = await builder.analyze();

          const criticalSerious = results.violations.filter(
            (v) => v.impact === "critical" || v.impact === "serious",
          );
          const minorModerate = results.violations.filter(
            (v) => v.impact === "minor" || v.impact === "moderate",
          );

          const entry = {
            page: label,
            path,
            url,
            criticalSerious: criticalSerious.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              helpUrl: v.helpUrl,
              nodes: v.nodes.length,
              targets: v.nodes.map((n) => n.target).flat(),
            })),
            minorModerate: minorModerate.map((v) => ({
              id: v.id,
              impact: v.impact,
              help: v.help,
              helpUrl: v.helpUrl,
              nodes: v.nodes.length,
            })),
            passes: results.passes.length,
            incomplete: results.incomplete.length,
            inapplicable: results.inapplicable.length,
          };

          allResults.push(entry);

          // Report any violations
          if (criticalSerious.length > 0) {
            console.log(`\n  ❌ ${label}: ${criticalSerious.length} critical/serious violations`);
            for (const v of criticalSerious) {
              console.log(`     - ${v.id} (${v.impact}): ${v.help}`);
              console.log(`       Targets: ${v.nodes.map((n) => n.target).join(", ")}`);
            }
          }

          if (minorModerate.length > 0) {
            console.log(`\n  ⚠️  ${label}: ${minorModerate.length} minor/moderate violations`);
            for (const v of minorModerate) {
              console.log(`     - ${v.id} (${v.impact}): ${v.help}`);
            }
          }

          console.log(`  ✅ ${label}: ${results.passes} checks passed, ${results.violations.length} violations`);

          assert.strictEqual(
            criticalSerious.length,
            0,
            `${label} has ${criticalSerious.length} critical/serious accessibility violation(s)`,
          );
        } finally {
          await page.close();
        }
      });
    }

    // Summary after all pages
    t.after(async () => {
      console.log("\n── WCAG 2.2 AA Summary ──");
      console.log(`Pages tested: ${TEST_PAGES.length}`);
      const totalCriticalSerious = allResults.reduce((sum, r) => sum + r.criticalSerious.length, 0);
      const totalMinorModerate = allResults.reduce((sum, r) => sum + r.minorModerate.length, 0);
      const totalPasses = allResults.reduce((sum, r) => sum + r.passes, 0);
      console.log(`Total axe checks passed: ${totalPasses}`);
      console.log(`Total critical/serious violations: ${totalCriticalSerious}`);
      console.log(`Total minor/moderate violations: ${totalMinorModerate}`);
      console.log("────────────────────────\n");
    });

    await browser.close();
  } finally {
    await stopServer();
  }
});