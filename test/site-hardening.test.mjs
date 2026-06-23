import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = new URL("../", import.meta.url);
const rootPath = fileURLToPath(root);
const astroBinPath = fileURLToPath(new URL("./node_modules/astro/bin/astro.mjs", root));
let buildArtifactsReady = false;

function read(path) {
  return readFileSync(new URL(path, root), "utf8");
}

function buildArtifacts() {
  if (buildArtifactsReady) return;

  execFileSync(process.execPath, [astroBinPath, "build"], {
    cwd: rootPath,
    stdio: "pipe",
  });
  execFileSync(process.execPath, ["./scripts/generate-llms-txt.mjs"], {
    cwd: rootPath,
    stdio: "pipe",
  });
  buildArtifactsReady = true;
}

function readArtifact(path) {
  buildArtifacts();
  return read(path);
}

test("default build command installs the browser before the Astro build", () => {
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts.build, "npm run setup:browser && astro build && npm run build:llms");
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

test("CI installs the browser before running hardening tests and builds", () => {
  const ci = read(".github/workflows/ci.yml");

  assert.match(ci, /npm test/);
  assert.match(ci, /npm run setup:browser:ci/);
  assert.match(ci, /npm run build:ci/);
  assert.ok(
    ci.indexOf("npm run setup:browser:ci") < ci.indexOf("npm test"),
    "CI must install the browser before running the hardening test suite",
  );
  assert.ok(
    ci.indexOf("npm run setup:browser:ci") < ci.indexOf("npm run build:ci"),
    "CI must install the browser before running the build",
  );
});

test("CI audit uses the named policy script instead of raw npm audit", () => {
  const ci = read(".github/workflows/ci.yml");
  const pkg = JSON.parse(read("package.json"));

  assert.equal(pkg.scripts["audit:ci"], "node ./scripts/check-npm-audit.mjs");
  assert.match(ci, /npm run audit:ci/);
  assert.doesNotMatch(ci, /npm audit --audit-level=high/);
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
  const wildcardBlock = headers.match(/^\/\*\n(?:(?: {2}.+\n?)+)/m)?.[0] ?? "";
  const expectedHeaders = [
    "X-Frame-Options: DENY",
    "X-Content-Type-Options: nosniff",
    "Referrer-Policy: strict-origin-when-cross-origin",
    "Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Strict-Transport-Security: max-age=31536000; includeSubDomains",
  ];

  assert.notEqual(wildcardBlock, "", "missing wildcard /* header block");

  for (const header of expectedHeaders) {
    assert.ok(wildcardBlock.includes(`  ${header}`), `missing wildcard header: ${header}`);
  }

  assert.match(wildcardBlock, / {2}Content-Security-Policy:\s+[^\n]+/);
  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "worker-src 'self'",
    "connect-src 'self'",
    "upgrade-insecure-requests",
  ]) {
    assert.ok(wildcardBlock.includes(directive), `missing CSP directive: ${directive}`);
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

test("legacy /en compatibility redirects normalize to root English URLs", () => {
  const redirects = read("public/_redirects");

  assert.match(redirects, /^\/en \/ 301$/m);
  assert.match(redirects, /^\/en\/ \/ 301$/m);
  assert.match(redirects, /^\/en\/\* \/:splat 301$/m);
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
  "src/content/docs/installation/helm.mdx",
  "src/content/docs/zh/installation/helm.mdx",
  "src/content/docs/1.5/installation/helm.mdx",
  "src/content/docs/zh/1.5/installation/helm.mdx",
  "src/content/docs/installation/production.mdx",
  "src/content/docs/zh/installation/production.mdx",
  "src/content/docs/1.5/installation/production.mdx",
  "src/content/docs/zh/1.5/installation/production.mdx",
  "src/content/docs/configuration/index.mdx",
  "src/content/docs/zh/configuration/index.mdx",
  "src/content/docs/1.5/configuration/index.mdx",
  "src/content/docs/zh/1.5/configuration/index.mdx",
  "src/content/docs/configuration/controlplane.mdx",
  "src/content/docs/zh/configuration/controlplane.mdx",
  "src/content/docs/1.5/configuration/controlplane.mdx",
  "src/content/docs/zh/1.5/configuration/controlplane.mdx",
  "src/content/docs/configuration/experimental-features.mdx",
  "src/content/docs/zh/configuration/experimental-features.mdx",
  "src/content/docs/1.5/configuration/experimental-features.mdx",
  "src/content/docs/zh/1.5/configuration/experimental-features.mdx",
  "src/content/docs/operations/grafana.mdx",
  "src/content/docs/zh/operations/grafana.mdx",
  "src/content/docs/1.5/operations/grafana.mdx",
  "src/content/docs/zh/1.5/operations/grafana.mdx",
  "src/content/docs/contributing/index.mdx",
  "src/content/docs/zh/contributing/index.mdx",
  "src/content/docs/1.5/contributing/index.mdx",
  "src/content/docs/zh/1.5/contributing/index.mdx",
  "src/content/docs/contributing/release.mdx",
  "src/content/docs/zh/contributing/release.mdx",
  "src/content/docs/1.5/contributing/release.mdx",
  "src/content/docs/zh/1.5/contributing/release.mdx",
  "src/components/landing/QuickStart.astro",
  "src/components/landing/Features.astro",
];

const defaultInstallDocPaths = [
  "src/content/docs/installation/index.mdx",
  "src/content/docs/zh/installation/index.mdx",
  "src/content/docs/installation/helm.mdx",
  "src/content/docs/zh/installation/helm.mdx",
  "src/content/docs/1.5/installation/index.mdx",
  "src/content/docs/zh/1.5/installation/index.mdx",
  "src/content/docs/1.5/installation/helm.mdx",
  "src/content/docs/zh/1.5/installation/helm.mdx",
];

const dataplaneHelmIdentityDocPaths = [
  "src/content/docs/installation/helm.mdx",
  "src/content/docs/zh/installation/helm.mdx",
  "src/content/docs/1.5/installation/helm.mdx",
  "src/content/docs/zh/1.5/installation/helm.mdx",
];

const dataplaneTroubleshootingDocPaths = [
  "src/content/docs/operations/troubleshooting.mdx",
  "src/content/docs/zh/operations/troubleshooting.mdx",
  "src/content/docs/1.5/operations/troubleshooting.mdx",
  "src/content/docs/zh/1.5/operations/troubleshooting.mdx",
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

test("default-install docs describe current default image tag semantics", () => {
  const docs = readMany(defaultInstallDocPaths);

  assert.match(docs, /tag:\s*"latest"/);
  assert.doesNotMatch(docs, /tag:\s*"sha-b3b9649"/);
  assert.doesNotMatch(docs, /tag:\s*""/);
  assert.doesNotMatch(docs, /\.Chart\.AppVersion/);
  assert.doesNotMatch(docs, /currently `0\.1\.0`/);
});

test("LLM reference files describe current Helm image defaults", () => {
  const llmsTxt = readArtifact("dist/llms.txt");
  const llmsFullTxt = readArtifact("dist/llms-full.txt");
  const docs = `\n--- llms.txt ---\n${llmsTxt}\n--- llms-full.txt ---\n${llmsFullTxt}`;

  assert.match(docs, /uses the latest tag/i);
  assert.doesNotMatch(docs, /sha-b3b9649/);
  assert.doesNotMatch(docs, /\.Chart\.AppVersion/);
  assert.doesNotMatch(docs, /appVersion 0\.1\.0/);
});

test("English surfaced docs links no longer publish /en prefixes", () => {
  const surfacedPages = {
    "dist/llms.txt": readArtifact("dist/llms.txt"),
    "dist/llms-full.txt": readArtifact("dist/llms-full.txt"),
    "dist/index.html": readArtifact("dist/index.html"),
    "dist/about/index.html": readArtifact("dist/about/index.html"),
    "dist/overview/index.html": readArtifact("dist/overview/index.html"),
  };

  for (const [path, html] of Object.entries(surfacedPages)) {
    assert.doesNotMatch(html, /https:\/\/nantian\.dev\/en\//, `${path} should not publish absolute /en/ URLs`);
    assert.doesNotMatch(html, /\/en\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\//, `${path} should not publish root-locale docs under /en/`);
  }
});

test("docs pages stop publishing the shared generic description", () => {
  const docsPages = {
    "dist/overview/index.html": readArtifact("dist/overview/index.html"),
    "dist/api-reference/index.html": readArtifact("dist/api-reference/index.html"),
  };

  for (const [path, html] of Object.entries(docsPages)) {
    assert.doesNotMatch(
      html,
      /Nantian Gateway — High-performance Kubernetes Gateway API implementation with Go control plane, Rust data plane, and built-in AI gateway capabilities\./,
      `${path} should not reuse the shared generic docs description`,
    );
    assert.doesNotMatch(html, /SearchAction|search_term_string/, `${path} should not advertise a fake search endpoint`);
  }
});

test("landing pages do not advertise a nonexistent search endpoint", () => {
  const landingPages = {
    "dist/index.html": readArtifact("dist/index.html"),
    "dist/about/index.html": readArtifact("dist/about/index.html"),
  };

  for (const [path, html] of Object.entries(landingPages)) {
    assert.doesNotMatch(html, /SearchAction|search_term_string/, `${path} should not advertise a fake search endpoint`);
  }
});

test("release docs describe split repository version coordination", () => {
  const docs = readMany([
    "src/content/docs/contributing/release.mdx",
    "src/content/docs/zh/contributing/release.mdx",
    "src/content/docs/1.5/contributing/release.mdx",
    "src/content/docs/zh/1.5/contributing/release.mdx",
  ]);

  assert.match(docs, /product version/i);
  assert.match(docs, /chart version/i);
  assert.match(docs, /appVersion/i);
  assert.match(docs, /controlplane/i);
  assert.match(docs, /dataplane/i);
  assert.match(docs, /dashboard/i);
  assert.doesNotMatch(docs, /gateway\/VERSION/);
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
  assert.doesNotMatch(docs, /sha-b3b9649/);
  assert.doesNotMatch(docs, /tag:\s*"0\.1\.0"/);
  assert.doesNotMatch(docs, /monitoring:\s*\n\s+serviceMonitor/);
  assert.doesNotMatch(docs, /monitoring\.serviceMonitor/);
  assert.doesNotMatch(docs, /\/etc\/nantian\/config\.yaml/);
  assert.doesNotMatch(docs, /nantian-dataplane-admin/);
  assert.doesNotMatch(docs, /dataplane\.config\.experimental/);
});

test("Helm docs explain Pod-derived dataplane node IDs and stable session-persistence settings", () => {
  const docs = readMany(dataplaneHelmIdentityDocPaths);

  assert.match(docs, /NANTIAN_GW_NODE_ID/);
  assert.match(docs, /metadata\.name/);
  assert.match(docs, /sharedSecret/);
  assert.match(docs, /existingSecret/);
});

test("troubleshooting docs explain superseded xDS streams as duplicate dataplane node IDs", () => {
  const docs = readMany(dataplaneTroubleshootingDocPaths);

  assert.match(docs, /xds stream superseded by newer connection/);
  assert.match(docs, /NANTIAN_GW_NODE_ID/);
  assert.match(docs, /PGW_NODE_ID/);
  assert.match(docs, /nodeId/);
});

test("landing layouts derive canonical metadata and navbar links from route context", () => {
  const landingLayout = read("src/layouts/LandingLayout.astro");
  const navbar = read("src/components/landing/Navbar.astro");

  assert.doesNotMatch(landingLayout, /canonical\s*=\s*'https:\/\/nantian\.dev\/'/);
  assert.match(landingLayout, /Astro\.url\.pathname/);
  assert.doesNotMatch(navbar, /<a\s+href='"\/"'/);
  assert.doesNotMatch(navbar, /switchHref:\s*lang === 'zh' \? '\/' : '\/zh\/'/);
  assert.match(navbar, /<script is:inline src=\{navbarScriptUrl\}><\/script>/);
});

test("quick start copy labels stay externalized for landing pages", () => {
  const quickStart = read("src/components/landing/QuickStart.astro");

  assert.doesNotMatch(quickStart, /\$\{copiedLabel\}/);
  assert.doesNotMatch(quickStart, /\$\{copyLabel\}/);
  assert.match(quickStart, /<script is:inline src=\{quickStartScriptUrl\}><\/script>/);
});

test("docs pages keep required Starlight inline scripts and CSP allows them", () => {
  const headers = read("public/_headers");
  const docsPage = readArtifact("dist/concepts/index.html");
  const landingHome = readArtifact("dist/index.html");

  assert.match(headers, /script-src[^\n]*'unsafe-inline'/);
  assert.match(docsPage, /window\.StarlightThemeProvider/);
  assert.match(docsPage, /customElements\.define\("starlight-theme-select"/);
  assert.match(docsPage, /customElements\.define\("starlight-lang-select"/);
  assert.match(landingHome, /<script[^>]*src="\/_astro\/navbar\.client\.[^"]+\.js"[^>]*><\/script>/i);
});

test("configuration overview renders GFM tables as HTML tables in the build artifact", () => {
  const configurationOverview = readArtifact("dist/configuration/index.html");

  assert.match(configurationOverview, /<table[\s>]/);
  assert.match(configurationOverview, />Page<\/th>/);
  assert.match(configurationOverview, />Covers<\/th>/);
  assert.match(configurationOverview, />Performance Tuning</);
  assert.doesNotMatch(configurationOverview, /<p>\| Page \| Covers \|/);
});

test("English docs build at root locale with root-path metadata", () => {
  const production = readArtifact("dist/installation/production/index.html");

  assert.match(production, /<link rel="canonical" href="https:\/\/nantian\.dev\/installation\/production\/"\/?>/);
  assert.match(production, /property="og:url" content="https:\/\/nantian\.dev\/installation\/production\/"/);
  assert.match(production, /hreflang="en" href="https:\/\/nantian\.dev\/installation\/production\/"\/?>/);
  assert.match(production, /hreflang="zh-CN" href="https:\/\/nantian\.dev\/zh\/installation\/production\/"\/?>/);
  assert.match(production, /hreflang="x-default" href="https:\/\/nantian\.dev\/installation\/production\/"\/?>/);
  assert.doesNotMatch(production, /https:\/\/nantian\.dev\/en\/installation\/production\//);
});

test("versioned English docs build at root locale without /en prefixes", () => {
  const production = readArtifact("dist/1.5/installation/production/index.html");

  assert.match(production, /<link rel="canonical" href="https:\/\/nantian\.dev\/1\.5\/installation\/production\/"\/?>/);
  assert.match(production, /property="og:url" content="https:\/\/nantian\.dev\/1\.5\/installation\/production\/"/);
  assert.match(production, /hreflang="en" href="https:\/\/nantian\.dev\/1\.5\/installation\/production\/"\/?>/);
  assert.match(production, /hreflang="zh-CN" href="https:\/\/nantian\.dev\/zh\/1\.5\/installation\/production\/"\/?>/);
  assert.match(production, /hreflang="x-default" href="https:\/\/nantian\.dev\/1\.5\/installation\/production\/"\/?>/);
  assert.doesNotMatch(production, /https:\/\/nantian\.dev\/en\/1\.5\/installation\/production\//);
  assert.doesNotMatch(production, /https:\/\/nantian\.dev\/zh\/en\/1\.5\/installation\/production\//);
});

test("built landing pages emit page-specific canonicals and avoid inline landing scripts", () => {
  const about = readArtifact("dist/about/index.html");
  const zhAbout = readArtifact("dist/zh/about/index.html");
  const home = readArtifact("dist/index.html");
  const homeScripts = [...home.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(([, src]) => src);
  const aboutScripts = [...about.matchAll(/<script[^>]*src="([^"]+)"[^>]*><\/script>/g)].map(([, src]) => src);

  assert.match(about, /<link rel="canonical" href="https:\/\/nantian\.dev\/about\/">/);
  assert.match(zhAbout, /<link rel="canonical" href="https:\/\/nantian\.dev\/zh\/about\/">/);
  assert.match(zhAbout, /href="\/zh\/"/);
  assert.doesNotMatch(home, /<script type="module">const d=document\.getElementById\("landing-navbar"\)/);
  assert.doesNotMatch(home, /\$\{copiedLabel\}|\$\{copyLabel\}/);
  assert.ok(homeScripts.every((src) => !src.startsWith("data:")), "home landing scripts must not ship as data: module URLs");
  assert.ok(aboutScripts.every((src) => !src.startsWith("data:")), "about landing scripts must not ship as data: module URLs");
  assert.match(home, /<script[^>]*src="\/_astro\/navbar\.client\.[^"]+\.js"[^>]*><\/script>/i);
  assert.match(home, /<script[^>]*src="\/_astro\/quickstart\.client\.[^"]+\.js"[^>]*><\/script>/i);
  assert.match(about, /<script[^>]*src="\/_astro\/navbar\.client\.[^"]+\.js"[^>]*><\/script>/i);
});
