import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { docsSidebar } from "../src/config/docsSidebar.js";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function exists(path) {
  return existsSync(fileURLToPath(new URL(path, root)));
}

const featurePages = [
  "features/index.mdx",
  "features/ai-gateway.mdx",
  "features/wasm-plugins.mdx",
  "features/traffic-management.mdx",
  "features/security-observability.mdx",
];

const docPrefixes = [
  "src/content/docs",
  "src/content/docs/zh",
  "src/content/docs/1.5",
  "src/content/docs/zh/1.5",
];

test("feature docs exist for current, localized, and versioned routes", () => {
  for (const prefix of docPrefixes) {
    for (const page of featurePages) {
      const path = `${prefix}/${page}`;
      assert.ok(exists(path), `missing ${path}`);
    }
  }
});

test("feature sidebar exposes the new feature section", () => {
  const featureSection = docsSidebar.find(({ label }) => label === "Features");

  assert.ok(featureSection, "missing Features sidebar section");
  assert.equal(featureSection.translations?.["zh-CN"], "功能");

  function collectLinks(items) {
    return items.flatMap((item) => {
      const links = [];
      if (item.link) links.push(item.link);
      if (item.items) links.push(...collectLinks(item.items));
      return links;
    });
  }

  const allLinks = collectLinks(featureSection.items ?? []);

  for (const link of [
    "features/",
    "features/ai-gateway",
    "features/wasm-plugins",
    "features/traffic-management",
    "features/security-observability",
  ]) {
    assert.ok(allLinks.includes(link), `missing sidebar link ${link}`);
  }
});

test("feature docs document AI Gateway and Wasm CRDs without hiding experimental status", () => {
  const aiDocs = [
    read("src/content/docs/features/ai-gateway.mdx"),
    read("src/content/docs/zh/features/ai-gateway.mdx"),
    read("src/content/docs/1.5/features/ai-gateway.mdx"),
    read("src/content/docs/zh/1.5/features/ai-gateway.mdx"),
  ].join("\n");
  const wasmDocs = [
    read("src/content/docs/features/wasm-plugins.mdx"),
    read("src/content/docs/zh/features/wasm-plugins.mdx"),
    read("src/content/docs/1.5/features/wasm-plugins.mdx"),
    read("src/content/docs/zh/1.5/features/wasm-plugins.mdx"),
  ].join("\n");

  for (const required of ["AIService", "TokenPolicy", "gateway.nantian.dev/v1alpha1", "enableAiGateway"]) {
    assert.match(aiDocs, new RegExp(required), `AI docs should mention ${required}`);
  }

  for (const required of ["WasmPlugin", "onRequest", "onResponse", "onStreamChunk", "maxMemoryBytes"]) {
    assert.match(wasmDocs, new RegExp(required), `Wasm docs should mention ${required}`);
  }

  assert.match(aiDocs, /Experimental|实验/);
  assert.match(wasmDocs, /Experimental|实验/);
});

test("landing feature cards link to feature documentation", () => {
  const featureCard = read("src/components/landing/FeatureCard.astro");
  const features = read("src/components/landing/Features.astro");

  assert.match(featureCard, /href\?:\s*string/);
  assert.match(featureCard, /href=\{href\}/);
  assert.match(features, /href:\s*'\/features\/ai-gateway\/'/);
  assert.match(features, /href:\s*'\/features\/wasm-plugins\/'/);
  assert.match(features, /href:\s*'\/zh\/features\/ai-gateway\/'/);
  assert.match(features, /href:\s*'\/zh\/features\/wasm-plugins\/'/);
});

test("use-case next steps point AI and Wasm readers to feature pages", () => {
  const docs = [
    read("src/content/docs/overview/use-cases.mdx"),
    read("src/content/docs/zh/overview/use-cases.mdx"),
    read("src/content/docs/1.5/overview/use-cases.mdx"),
    read("src/content/docs/zh/1.5/overview/use-cases.mdx"),
  ].join("\n");

  assert.match(docs, /features\/ai-gateway/);
  assert.match(docs, /features\/wasm-plugins/);
  assert.doesNotMatch(docs, /\[AI Gateway configuration\]\(\.\.\/configuration\/\)/);
  assert.doesNotMatch(docs, /\[Wasm plugin development\]\(\.\.\/architecture\/dataplane\/\)/);
});
