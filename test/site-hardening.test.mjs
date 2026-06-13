import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const root = new URL("../", import.meta.url);

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

test("default build command installs the browser before the Astro build", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.build, "npm run setup:browser && astro build");
  assert.equal(pkg.scripts["build:astro"], "astro build");
  assert.equal(pkg.scripts["setup:browser"], "npx playwright install chromium");
  assert.equal(pkg.scripts["setup:browser:ci"], "npx playwright install --with-deps chromium");
  assert.equal(pkg.scripts.test, "node --test test/*.test.mjs");

  for (const [name, script] of Object.entries(pkg.scripts)) {
    assert.doesNotMatch(
      script,
      /npx playwright install chromium && astro build/,
      `${name} should call the named setup script instead of duplicating the browser install command`,
    );
  }
});

test("CI runs hardening tests and installs the browser before building", () => {
  const ci = read(".github/workflows/ci.yml");

  assert.match(ci, /npm test/);
  assert.match(ci, /npm run setup:browser:ci/);
  assert.match(ci, /npm run build:astro/);
  assert.ok(
    ci.indexOf("npm run setup:browser:ci") < ci.indexOf("npm run build:astro"),
    "CI must install the browser before running the build",
  );
});

test("Cloudflare Pages config declares the static output directory", () => {
  const config = JSON.parse(read("wrangler.jsonc"));

  assert.equal(config.name, "website");
  assert.equal(config.pages_build_output_dir, "./dist");
  assert.equal(config.compatibility_date, "2026-06-07");
  assert.equal(config.main, undefined);
  assert.equal(config.assets, undefined);
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

const chartDocPaths = [
  "src/content/docs/en/installation/helm.mdx",
  "src/content/docs/zh/installation/helm.mdx",
  "src/content/docs/en/1.5/installation/helm.mdx",
  "src/content/docs/zh/1.5/installation/helm.mdx",
  "src/content/docs/en/installation/production.mdx",
  "src/content/docs/zh/installation/production.mdx",
  "src/content/docs/en/1.5/installation/production.mdx",
  "src/content/docs/zh/1.5/installation/production.mdx",
  "src/content/docs/en/configuration/index.mdx",
  "src/content/docs/zh/configuration/index.mdx",
  "src/content/docs/en/1.5/configuration/index.mdx",
  "src/content/docs/zh/1.5/configuration/index.mdx",
  "src/content/docs/en/configuration/controlplane.mdx",
  "src/content/docs/zh/configuration/controlplane.mdx",
  "src/content/docs/en/1.5/configuration/controlplane.mdx",
  "src/content/docs/zh/1.5/configuration/controlplane.mdx",
  "src/content/docs/en/configuration/experimental-features.mdx",
  "src/content/docs/zh/configuration/experimental-features.mdx",
  "src/content/docs/en/1.5/configuration/experimental-features.mdx",
  "src/content/docs/zh/1.5/configuration/experimental-features.mdx",
  "src/content/docs/en/operations/grafana.mdx",
  "src/content/docs/zh/operations/grafana.mdx",
  "src/content/docs/en/1.5/operations/grafana.mdx",
  "src/content/docs/zh/1.5/operations/grafana.mdx",
  "src/content/docs/en/contributing/index.mdx",
  "src/content/docs/zh/contributing/index.mdx",
  "src/content/docs/en/1.5/contributing/index.mdx",
  "src/content/docs/zh/1.5/contributing/index.mdx",
  "src/content/docs/en/contributing/release.mdx",
  "src/content/docs/zh/contributing/release.mdx",
  "src/content/docs/en/1.5/contributing/release.mdx",
  "src/content/docs/zh/1.5/contributing/release.mdx",
  "src/components/landing/QuickStart.astro",
  "src/components/landing/Features.astro",
  "public/llms.txt",
  "public/llms-full.txt",
];

function readMany(paths) {
  return paths.map((path) => `\n--- ${path} ---\n${read(path)}`).join("\n");
}

test("chart-facing docs use the current Helm repository and chart location", () => {
  const docs = readMany(chartDocPaths);

  assert.match(docs, /https:\/\/chart\.nantian\.dev/);
  assert.match(docs, /helm-charts\/charts\/nantian-gw/);
  assert.doesNotMatch(docs, /https:\/\/charts\.nantian\.dev/);
  assert.doesNotMatch(docs, /gateway\/deploy\/helm\/nantian-gw/);
  assert.doesNotMatch(docs, /gateway\/deploy\/helm/);
  assert.doesNotMatch(docs, /deploy\/helm\/nantian-gw/);
  assert.doesNotMatch(docs, /deploy\/helm/);
});

test("chart-facing docs describe current default images and app version semantics", () => {
  const docs = readMany(chartDocPaths);

  assert.match(docs, /tag:\s*"sha-b3b9649"/);
  assert.match(docs, /Helm resolves them to `\.Chart\.AppVersion`/i);
  assert.match(docs, /0\.1\.0/);
  assert.doesNotMatch(docs, /tag:\s*"latest"|tag:\s*latest/);
});

test("chart-facing docs use current Helm values and rendered service names", () => {
  const docs = readMany(chartDocPaths);

  assert.match(docs, /featureMode:\s*standard/);
  assert.match(docs, /installCRDs:\s*false/);
  assert.match(docs, /channel:\s*standard/);
  assert.match(docs, /serviceMonitor:\s*\n\s+enabled:\s*false/);
  assert.match(docs, /\/etc\/nantian-gw\/config\.yaml/);
  assert.match(docs, /nantian-gw-dataplane-admin/);
  assert.match(docs, /http:\/\/nantian-gw-dataplane-admin\.nantian-gw\.svc\.cluster\.local:19080/);
  assert.doesNotMatch(docs, /monitoring:\s*\n\s+serviceMonitor/);
  assert.doesNotMatch(docs, /monitoring\.serviceMonitor/);
  assert.doesNotMatch(docs, /\/etc\/nantian\/config\.yaml/);
  assert.doesNotMatch(docs, /nantian-dataplane-admin/);
  assert.doesNotMatch(docs, /dataplane\.config\.experimental/);
});

test("landing layouts derive canonical metadata and navbar links from route context", () => {
  const landingLayout = read("src/layouts/LandingLayout.astro");
  const navbar = read("src/components/landing/Navbar.astro");

  assert.doesNotMatch(landingLayout, /canonical\s*=\s*'https:\/\/nantian\.dev\/'/);
  assert.match(landingLayout, /Astro\.url\.pathname|pathname/);
  assert.doesNotMatch(navbar, /href=\"\/\"/);
  assert.doesNotMatch(navbar, /switchHref:\s*lang === 'zh' \? '\/' : '\/zh\/'/);
});

test("quick start copy labels and CSP avoid inline-script regressions", () => {
  const quickStart = read("src/components/landing/QuickStart.astro");
  const headers = read("public/_headers");

  assert.doesNotMatch(quickStart, /\$\{copiedLabel\}/);
  assert.doesNotMatch(quickStart, /\$\{copyLabel\}/);
  assert.doesNotMatch(headers, /script-src[^\n]*'unsafe-inline'/);
});

test("built landing pages emit page-specific canonicals and avoid inline landing scripts", () => {
  const about = read("dist/about/index.html");
  const zhAbout = read("dist/zh/about/index.html");
  const home = read("dist/index.html");

  assert.match(about, /<link rel="canonical" href="https:\/\/nantian\.dev\/about\/">/);
  assert.match(zhAbout, /<link rel="canonical" href="https:\/\/nantian\.dev\/zh\/about\/">/);
  assert.match(zhAbout, /href="\/zh\/"/);
  assert.doesNotMatch(home, /<script type="module">const d=document\.getElementById\("landing-navbar"\)/);
  assert.doesNotMatch(home, /\$\{copiedLabel\}|\$\{copyLabel\}/);
});
