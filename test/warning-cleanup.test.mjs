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

  assert.match(config, /import\s+\{\s*unified\s*\}\s+from\s+'@astrojs\/markdown-remark';/);
  assert.match(config, /markdown:\s*\{\s*processor:\s*unified\(\{\s*rehypePlugins:\s*\[rehypeMermaid\]\s*\}\)\s*\}/s);
  assert.doesNotMatch(config, /markdown:\s*\{[\s\S]*gfm:/);
  assert.doesNotMatch(config, /markdown:\s*\{[\s\S]*rehypePlugins:/);
});

test("landing page JSON-LD scripts are explicitly inline", () => {
  const layout = read("src/layouts/LandingLayout.astro");

  assert.match(layout, /<script is:inline type="application\/ld\+json" set:html=\{JSON\.stringify\(jsonLd\)\} \/>/);
  assert.match(layout, /<script is:inline type="application\/ld\+json" set:html=\{JSON\.stringify\(orgJsonLd\)\} \/>/);
});

test("quick start copy logic no longer falls back to execCommand", () => {
  const client = read("src/components/landing/quickstart.client.js");

  assert.match(client, /navigator\.clipboard\?\.writeText/);
  assert.doesNotMatch(client, /document\.execCommand\('copy'\)/);
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
  ].map(read).join("\n");

  assert.doesNotMatch(docs, /```promql/);
});
