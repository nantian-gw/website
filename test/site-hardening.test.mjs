import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

test("package scripts keep browser setup separate from the Astro build", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.build, "astro build");
  assert.equal(pkg.scripts["setup:browser"], "npx playwright install chromium");
  assert.equal(pkg.scripts["setup:browser:ci"], "npx playwright install --with-deps chromium");
  assert.equal(pkg.scripts.test, "node --test test/*.test.mjs");

  for (const [name, script] of Object.entries(pkg.scripts)) {
    assert.doesNotMatch(
      script,
      /playwright install.*&&.*astro build/,
      `${name} must not combine browser installation with the Astro build`,
    );
  }
});

test("CI runs hardening tests and installs the browser before building", () => {
  const ci = read(".github/workflows/ci.yml");

  assert.match(ci, /npm test/);
  assert.match(ci, /npm run setup:browser:ci/);
  assert.match(ci, /npm run build/);
  assert.ok(
    ci.indexOf("npm run setup:browser:ci") < ci.indexOf("npm run build"),
    "CI must install the browser before running the build",
  );
});

test("Cloudflare Pages headers include wildcard security headers", () => {
  const headers = read("public/_headers");
  const wildcardBlock = headers.match(/^\/\*\n(?:(?:  .+\n?)+)/m)?.[0] ?? "";
  const expectedHeaders = [
    "X-Frame-Options: DENY",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Strict-Transport-Security: max-age=31536000; includeSubDomains",
    "Content-Security-Policy: default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; worker-src 'self'; connect-src 'self'; upgrade-insecure-requests",
  ];

  assert.notEqual(wildcardBlock, "", "missing wildcard /* header block");

  for (const header of expectedHeaders) {
    assert.ok(wildcardBlock.includes(`  ${header}`), `missing wildcard header: ${header}`);
  }

  assert.match(headers, /^\/\.well-known\/http-message-signatures-directory\n/m);
  assert.match(headers, /^\/\.well-known\/api-catalog\n/m);
  assert.match(headers, /Content-Type: application\/http-message-signatures-directory\+json/);
  assert.match(headers, /Content-Type: application\/linkset\+json; profile="https:\/\/www\.rfc-editor\.org\/info\/rfc9727"/);
  assert.match(headers, /Access-Control-Allow-Origin: \*/);
});

test("sitemap redirect is permanent", () => {
  const redirects = read("public/_redirects");

  assert.match(redirects, /^\/sitemap\.xml \/sitemap-index\.xml 301$/m);
  assert.doesNotMatch(redirects, /^\/sitemap\.xml \/sitemap-index\.xml 302$/m);
});

test("landing page supports reduced motion", () => {
  const hero = read("src/components/landing/Hero.astro");
  const customCss = read("src/styles/custom.css");

  assert.match(hero, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  for (const selector of [".starfield-layer", ".hero-content", ".btn", ".btn-arrow"]) {
    assert.ok(hero.includes(selector), `Hero reduced-motion rules should mention ${selector}`);
  }
  assert.match(hero, /animation:\s*none\s*!important/);
  assert.match(hero, /transition:\s*none\s*!important/);
  assert.match(hero, /transform:\s*none\s*!important/);

  assert.match(customCss, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  for (const selector of [".star", ".glow-hover"]) {
    assert.ok(customCss.includes(selector), `Global reduced-motion rules should mention ${selector}`);
  }
  assert.match(customCss, /scroll-behavior:\s*auto\s*!important/);
});
