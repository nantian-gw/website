import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function exists(path) {
  return existsSync(new URL(path, root));
}

test("Astro markdown config uses the unified processor instead of deprecated top-level markdown plugins", () => {
  const config = read("astro.config.mjs");
  const markdownBlock = config.match(/markdown:\s*\{([\s\S]*?)\n\s*\},\n\s*integrations:/)?.[1] ?? "";

  assert.match(config, /@astrojs\/markdown-remark/);
  assert.match(markdownBlock, /processor:\s*unified\(/);
  assert.match(markdownBlock, /unified\([\s\S]*rehypePlugins:\s*\[[\s\S]*rehypeMermaid[\s\S]*\][\s\S]*\)/);
  assert.doesNotMatch(markdownBlock, /^\s*gfm\s*:/m);
  assert.doesNotMatch(markdownBlock, /^\s*rehypePlugins\s*:/m);
});

test("landing page JSON-LD scripts are explicitly inline", () => {
  const layout = read("src/layouts/LandingLayout.astro");

  assert.match(layout, /<script\b(?=[^>]*\bis:inline\b)(?=[^>]*\bset:html=\{JSON\.stringify\(jsonLd\)\})(?=[^>]*\btype="application\/ld\+json")[^>]*\/>/);
  assert.match(layout, /<script\b(?=[^>]*\bis:inline\b)(?=[^>]*\bset:html=\{JSON\.stringify\(orgJsonLd\)\})(?=[^>]*\btype="application\/ld\+json")[^>]*\/>/);
});

test("quick start copy logic no longer falls back to execCommand", () => {
  const client = read("src/components/landing/quickstart.client.js");

  assert.match(client, /navigator\.clipboard/);
  assert.match(client, /writeText/);
  assert.doesNotMatch(client, /document\.execCommand\s*\(/);
});

test("Starlight Banner override is removed while versioning stays enabled", () => {
  const config = read("astro.config.mjs");

  assert.match(config, /starlightVersions\(\{\s*versions:\s*\[\{\s*slug:\s*'1\.5'\s*\}\]\s*\}\)/s);
  assert.doesNotMatch(config, /Banner:\s*'\.\/src\/components\/docs\/Banner\.astro'/);
  assert.equal(exists("src/components/docs/Banner.astro"), false);
  assert.equal(exists("src/components/docs/StarlightOverrides.astro"), false);
});

test("PromQL fences are normalized away from docs", () => {
  const docs = [
    "src/content/docs/operations/grafana.mdx",
    "src/content/docs/operations/troubleshooting.mdx",
    "src/content/docs/zh/operations/grafana.mdx",
    "src/content/docs/zh/operations/troubleshooting.mdx",
    "src/content/docs/1.5/operations/grafana.mdx",
    "src/content/docs/1.5/operations/troubleshooting.mdx",
    "src/content/docs/zh/1.5/operations/grafana.mdx",
    "src/content/docs/zh/1.5/operations/troubleshooting.mdx",
  ];

  for (const path of docs) {
    assert.doesNotMatch(read(path), /```promql/, `${path} should not contain promql fences`);
  }
});
