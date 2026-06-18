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

function extractBlock(source, startToken) {
  const start = source.indexOf(startToken);
  if (start === -1) return "";

  const open = source.indexOf("{", start);
  if (open === -1) return "";

  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    const char = source[i];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  return source.slice(start);
}

function hasTopLevelProperty(objectLiteral, propertyName) {
  let depth = 0;
  let inString = null;
  let escaped = false;

  for (let i = 0; i < objectLiteral.length; i += 1) {
    const char = objectLiteral[i];

    if (inString) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === inString) {
        inString = null;
      }
      continue;
    }

    if (char === "'" || char === '"') {
      inString = char;
      continue;
    }

    if (char === "{") {
      depth += 1;
      continue;
    }

    if (char === "}") {
      depth -= 1;
      continue;
    }

    if (depth !== 1 || !objectLiteral.startsWith(propertyName, i)) {
      continue;
    }

    const before = objectLiteral[i - 1];
    const after = objectLiteral[i + propertyName.length];
    if ((before && /[\w$]/.test(before)) || (after && /[\w$]/.test(after))) {
      continue;
    }

    return true;
  }

  return false;
}

test("Astro markdown config uses the unified processor instead of deprecated top-level markdown plugins", () => {
  const config = read("astro.config.mjs");
  const markdownBlock = extractBlock(config, "markdown:");

  assert.match(config, /@astrojs\/markdown-remark/);
  assert.match(markdownBlock, /processor:\s*unified\(/);
  assert.match(markdownBlock, /unified\([\s\S]*rehypeMermaid[\s\S]*\)/);
  assert.ok(!hasTopLevelProperty(markdownBlock, "gfm"), "markdown.gfm should not remain at the top level");
  assert.ok(
    !hasTopLevelProperty(markdownBlock, "rehypePlugins"),
    "markdown.rehypePlugins should not remain at the top level",
  );
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

  assert.match(config, /starlightVersions\s*\(/);
  assert.match(config, /slug:\s*'1\.5'/);
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
