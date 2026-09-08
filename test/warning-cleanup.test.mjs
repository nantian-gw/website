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

test("Astro markdown config uses the unified processor with a client-side mermaid strategy", () => {
  const config = read("astro.config.mjs");
  const markdownBlock = extractBlock(config, "markdown:");

  assert.match(config, /@astrojs\/markdown-remark/);
  assert.match(markdownBlock, /processor:\s*unified\(/);
  assert.match(markdownBlock, /unified\([\s\S]*rehypeMermaid[\s\S]*\)/);
  assert.match(markdownBlock, /['"]pre-mermaid['"]/);
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

test("landing layout leaves landmark ownership to pages", () => {
  const layout = read("src/layouts/LandingLayout.astro");
  const home = read("src/pages/index.astro");
  const zhHome = read("src/pages/zh/index.astro");
  const contentLayout = read("src/layouts/ContentLayout.astro");

  assert.doesNotMatch(layout, /<main>\s*<slot\s*\/>\s*<\/main>/);
  assert.match(home, /<Navbar[\s\S]*<main>[\s\S]*<Hero[\s\S]*<\/main>[\s\S]*<Footer/);
  assert.match(zhHome, /<Navbar[\s\S]*<main>[\s\S]*<Hero[\s\S]*<\/main>[\s\S]*<Footer/);
  assert.match(contentLayout, /<Navbar[\s\S]*<main class="content-page">[\s\S]*<\/main>[\s\S]*<Footer/);
});

test("quick start copy logic no longer falls back to execCommand", () => {
  const client = read("src/components/landing/quickstart.client.js");

  assert.match(client, /navigator\.clipboard/);
  assert.match(client, /writeText/);
  assert.doesNotMatch(client, /document\.execCommand\s*\(/);
});

test("landing navbar scroll updates are frame-batched and state-guarded", () => {
  const client = read("src/components/landing/navbar.client.js");

  assert.match(client, /scheduleFrame\(syncNavbarScroll\)/);
  assert.match(client, /scrollFrame !== null/);
  assert.match(client, /nextScrolled === isScrolled/);
  assert.match(client, /classList\.toggle\('scrolled', nextScrolled\)/);
  assert.match(client, /addEventListener\('scroll', requestNavbarScrollUpdate, \{ passive: true \}\)/);
});

test("quick start copy button data is resolved before the click handler", () => {
  const client = read("src/components/landing/quickstart.client.js");
  const clickHandlerIndex = client.indexOf("button.addEventListener('click'");

  assert.ok(clickHandlerIndex > 0, "missing copy button click handler");
  for (const token of [
    "const cmd = button.dataset.copy;",
    "const copyLabel = button.dataset.copyLabel;",
    "const copiedLabel = button.dataset.copiedLabel;",
    "const label = button.querySelector('.code-copy-label');",
  ]) {
    const tokenIndex = client.indexOf(token);
    assert.ok(tokenIndex > 0 && tokenIndex < clickHandlerIndex, `${token} should be resolved before click handling`);
  }

  const clickHandler = client.slice(clickHandlerIndex);
  assert.doesNotMatch(clickHandler, /dataset\.(copy|copyLabel|copiedLabel)/);
  assert.doesNotMatch(clickHandler, /querySelector\('\.code-copy-label'\)/);
});

test("LLM generation CLI reuses one pass of page data for both outputs", () => {
  const script = read("scripts/generate-llms-txt.mjs");
  const mainBlock = extractBlock(script, "export function main");

  assert.match(script, /function collectSidebarPageData\(distDir, sidebar\)/);
  assert.match(script, /export function generateLlmsFiles\(distDir = defaultDistDir, sidebar = docsSidebar\)/);
  assert.match(script, /const sidebarSections = collectSidebarPageData\(distDir, sidebar\)/);
  assert.match(mainBlock, /generateLlmsFiles\(distDir\)/);
  assert.doesNotMatch(mainBlock, /generateLlmsTxt\(distDir\)/);
  assert.doesNotMatch(mainBlock, /generateLlmsFullTxt\(distDir\)/);
});

test("docs table-of-contents landmarks receive unique accessible names", () => {
  const footer = read("src/components/docs/Footer.astro");
  const client = read("src/components/docs/docs-landmarks.client.js");

  assert.match(footer, /mobileToc:\s*'Mobile table of contents'/);
  assert.match(footer, /desktopToc:\s*'Desktop table of contents'/);
  assert.match(footer, /codeRegion:\s*'Documentation code block'/);
  assert.match(footer, /import docsLandmarksScriptUrl from '\.\/docs-landmarks\.client\.js\?url&no-inline'/);
  assert.match(footer, /data-ntgw-docs-footer/);
  assert.match(footer, /data-mobile-toc-label=\{labels\.mobileToc\}/);
  assert.match(footer, /data-desktop-toc-label=\{labels\.desktopToc\}/);
  assert.match(footer, /data-code-region-label=\{labels\.codeRegion\}/);
  assert.match(footer, /<script is:inline src=\{docsLandmarksScriptUrl\}><\/script>/);
  assert.doesNotMatch(footer, /<script is:inline define:vars=/);
  assert.doesNotMatch(footer, /function annotateDocsLandmarks/);

  assert.match(client, /document\.querySelector\('\[data-ntgw-docs-footer\]'\)/);
  assert.match(client, /labels\.mobileTocLabel \|\| fallbackLabels\.mobileToc/);
  assert.match(client, /labels\.desktopTocLabel \|\| fallbackLabels\.desktopToc/);
  assert.match(client, /labels\.codeRegionLabel \|\| fallbackLabels\.codeRegion/);
  assert.match(client, /mobile-starlight-toc nav/);
  assert.match(client, /starlight-toc nav/);
  assert.match(client, /nav\.setAttribute\('aria-label', label\)/);
  assert.match(client, /nav\.removeAttribute\('aria-labelledby'\)/);
  assert.match(client, /pre\[role="region"\]:not\(\[aria-label\]\):not\(\[aria-labelledby\]\):not\(\[title\]\)/);
  assert.match(client, /region\.setAttribute\('aria-label', `\$\{codeRegionLabel\} \$\{index \+ 1\}\$\{suffix\}`\)/);
  assert.match(client, /window\.requestAnimationFrame\?\.bind\(window\)/);
  assert.match(client, /annotationPending/);
  assert.match(client, /frame\(annotateDocsLandmarks\)/);
  assert.match(client, /DOMContentLoaded', scheduleDocsLandmarkAnnotation, \{ once: true \}/);
  assert.match(client, /new MutationObserver\(scheduleDocsLandmarkAnnotation\)/);
  assert.match(client, /landmarkObserver\.observe\(document\.body \?\? document\.documentElement, \{/);
  assert.match(client, /childList:\s*true/);
  assert.match(client, /subtree:\s*true/);
  assert.doesNotMatch(client, /attributeFilter/);
  assert.doesNotMatch(client, /attributes:\s*true/);
  assert.match(client, /document\.addEventListener\('astro:page-load', scheduleDocsLandmarkAnnotation\)/);
  assert.match(client, /landmarkObserver\.disconnect\(\)/);
});

test("Starlight Banner override is removed while versioning stays enabled", () => {
  const config = read("astro.config.mjs");

  assert.match(config, /starlightVersions\s*\(/);
  assert.match(config, /slug:\s*'1\.5'/);
  assert.doesNotMatch(config, /Banner:\s*'\.\/src\/components\/docs\/Banner\.astro'/);
  assert.equal(exists("src/components/docs/Banner.astro"), false);
  assert.equal(exists("src/components/docs/StarlightOverrides.astro"), false);
});

test("custom 404 routes disable Starlight's built-in 404 and versioned Helm values docs keep explicit version slugs", () => {
  const config = read("astro.config.mjs");
  const versionedHelmValues = read("src/content/docs/1.5/configuration/helm-values.mdx");
  const zhVersionedHelmValues = read("src/content/docs/zh/1.5/configuration/helm-values.mdx");
  const versionConfig = JSON.parse(read("src/content/versions/1.5.json"));
  const configurationGroup = versionConfig.sidebar.find((group) => group.label === "Configuration");
  const helmValuesItem = configurationGroup?.items.find((item) => item.link === "configuration/helm-values");

  assert.match(config, /disable404Route:\s*true/);
  assert.equal(exists("src/pages/404.astro"), true);
  assert.equal(exists("src/pages/zh/404.astro"), true);
  assert.match(versionedHelmValues, /^slug:\s*1\.5\/configuration\/helm-values$/m);
  assert.match(zhVersionedHelmValues, /^slug:\s*zh\/1\.5\/configuration\/helm-values$/m);
  assert.deepEqual(helmValuesItem, {
    label: "Helm Values",
    link: "configuration/helm-values",
    translations: {
      "zh-CN": "Helm Values 指南",
    },
  });
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
