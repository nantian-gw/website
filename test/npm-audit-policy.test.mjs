import assert from "node:assert/strict";
import test from "node:test";

import { classifyAuditReport } from "../scripts/check-npm-audit.mjs";

test("allows the known unfixable Astro-stack high vulnerabilities", () => {
  const result = classifyAuditReport({
    vulnerabilities: {
      "@astrojs/mdx": { severity: "high", fixAvailable: false, via: ["astro"] },
      "@astrojs/starlight": {
        severity: "high",
        fixAvailable: false,
        via: ["@astrojs/mdx", "astro", "astro-expressive-code"],
      },
      astro: { severity: "high", fixAvailable: false, via: ["esbuild", "vite"] },
      "astro-expressive-code": { severity: "high", fixAvailable: false, via: ["astro"] },
      esbuild: {
        severity: "high",
        fixAvailable: false,
        via: [{ name: "esbuild", severity: "high" }],
      },
      "starlight-versions": {
        severity: "high",
        fixAvailable: false,
        via: ["@astrojs/starlight"],
      },
      vite: { severity: "high", fixAvailable: false, via: ["esbuild"] },
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
