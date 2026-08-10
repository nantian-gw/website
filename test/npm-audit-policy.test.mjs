import assert from "node:assert/strict";
import test from "node:test";

import { classifyAuditReport } from "../scripts/check-npm-audit.mjs";

test("allows the known unfixable Astro-stack high vulnerabilities", () => {
  const result = classifyAuditReport({
    vulnerabilities: {
      "@astrojs/internal-helpers": { severity: "high", fixAvailable: false, via: ["js-yaml"] },
      "@astrojs/markdown-remark": {
        severity: "high",
        fixAvailable: false,
        via: ["@astrojs/internal-helpers"],
      },
      "@astrojs/mdx": {
        severity: "high",
        fixAvailable: false,
        via: ["@astrojs/internal-helpers", "@astrojs/markdown-remark", "astro"],
      },
      "@astrojs/starlight": {
        severity: "high",
        fixAvailable: false,
        via: ["@astrojs/mdx", "astro", "astro-expressive-code", "js-yaml"],
      },
      astro: {
        severity: "high",
        fixAvailable: false,
        via: ["@astrojs/internal-helpers", "@astrojs/markdown-remark", "esbuild", "js-yaml", "sharp"],
      },
      "astro-expressive-code": { severity: "high", fixAvailable: false, via: ["astro"] },
      esbuild: {
        severity: "high",
        fixAvailable: false,
        via: [{ name: "esbuild", severity: "high" }],
      },
      "js-yaml": {
        severity: "high",
        fixAvailable: false,
        via: [{ name: "js-yaml", severity: "high" }],
      },
      "markdownlint-cli2": {
        severity: "high",
        fixAvailable: false,
        via: ["js-yaml", "markdown-it"],
      },
      sharp: {
        severity: "high",
        fixAvailable: false,
        via: [{ name: "sharp", severity: "high" }],
      },
    },
  });

  assert.deepEqual(result.actionable, []);
});

test("rejects high vulnerabilities outside the allowlist", () => {
  const result = classifyAuditReport({
    vulnerabilities: {
      lodash: {
        severity: "high",
        fixAvailable: false,
        via: [{ name: "lodash", severity: "high" }],
      },
    },
  });

  assert.equal(result.actionable.length, 1);
  assert.equal(result.actionable[0].name, "lodash");
});

test("rejects allowlisted packages once a fix becomes available", () => {
  const result = classifyAuditReport({
    vulnerabilities: {
      astro: {
        severity: "high",
        fixAvailable: { name: "astro", version: "7.0.0", isSemVerMajor: true },
        via: ["esbuild", "vite"],
      },
    },
  });

  assert.equal(result.actionable.length, 1);
  assert.equal(result.actionable[0].name, "astro");
});