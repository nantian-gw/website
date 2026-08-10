import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import test from 'node:test';
import { JSDOM } from 'jsdom';

const root = new URL('../', import.meta.url);
const docsRoot = fileURLToPath(new URL('src/content/docs', root));
const distRoot = fileURLToPath(new URL('dist', root));

function collectMdxFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMdxFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.mdx')) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function collectHtmlFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectHtmlFiles(entryPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      files.push(entryPath);
    }
  }
  return files.sort();
}

function isFenceLine(line) {
  return /^`{3,}\s*(\S+)?$/.test(line.trim());
}

function getFenceLanguage(line) {
  const match = line.trim().match(/^`{3,}\s*(\S+)?$/);
  return match && match[1] ? match[1] : null;
}

// ---------------------------------------------------------------------------
// Test suite: Broken links
// ---------------------------------------------------------------------------
test('all internal HTML links resolve to existing build artifacts', () => {
  if (!existsSync(distRoot)) {
    console.log('\n\u26a0 dist/ not found — skipping broken links test (run `npm run build:astro` first)');
    return;
  }

  const htmlFiles = collectHtmlFiles(distRoot);
  assert.ok(htmlFiles.length > 0, 'no HTML files found in dist/');
  assert.ok(htmlFiles.length > 0, 'no HTML files found in dist/ — run `npm run build:astro` first');

  const brokenLinks = [];

  for (const htmlFile of htmlFiles) {
    const html = readFileSync(htmlFile, 'utf8');
    const dom = new JSDOM(html);
    const anchors = dom.window.document.querySelectorAll('a[href]');

    for (const anchor of anchors) {
      const href = anchor.getAttribute('href');
      if (!href) continue;

      // Skip external links, anchors, mailto, javascript, and protocol-relative
      if (
        href.startsWith('http://') ||
        href.startsWith('https://') ||
        href.startsWith('#') ||
        href.startsWith('mailto:') ||
        href.startsWith('javascript:') ||
        href.startsWith('//')
      ) {
        continue;
      }

      // Resolve relative to the HTML file's directory.
      // For absolute paths (starting with /), resolve from distRoot.
      const resolved = href.startsWith('/')
        ? join(distRoot, href)
        : resolve(join(htmlFile, '..'), href);

      // Strip query string / hash
      const cleanPath = resolved.split('?')[0].split('#')[0];

      // Check if the resolved path exists (as a file or directory with index.html)
      if (!existsSync(cleanPath)) {
        if (!existsSync(join(cleanPath, 'index.html'))) {
          if (!existsSync(cleanPath + '.html')) {
            const withoutExt = cleanPath.replace(/\.html$/, '');
            if (!existsSync(withoutExt + '.html') && !existsSync(join(withoutExt, 'index.html'))) {
              brokenLinks.push({
                file: htmlFile.replace(distRoot + '/', ''),
                href,
                resolved: cleanPath,
              });
            }
          }
        }
      }
    }
  }

  // Filter out known false positives
  // (pre-existing navigation links to pages that don't exist at those paths)
  const knownFalsePositivePatterns = [
    // Pagefind search results
    { href: '/search/' },
    // Landing page links to /comparison/ and /use-cases/ (actual pages at /overview/comparison/ etc.)
    { href: '/comparison/' },
    { href: '/use-cases/' },
    { href: '/zh/comparison/' },
    { href: '/zh/use-cases/' },
    // Versioned doc nav links to /1.5/comparison and /1.5/use-cases (actual: /1.5/overview/v1.5-*)
    { href: '/1.5/comparison' },
    { href: '/1.5/use-cases' },
    { href: '/zh/1.5/comparison' },
    { href: '/zh/1.5/use-cases' },
    // Versioned page links to unversioned overview pages
    { href: '/overview/v1.5-comparison/' },
    { href: '/overview/v1.5-use-cases/' },
    { href: '/zh/overview/v1.5-comparison/' },
    { href: '/zh/overview/v1.5-use-cases/' },
    // Wasm plugin dev guide link
    { href: '/features/wasm-plugin-dev-guide/' },
    // Use-cases relative links to sibling sections (wrong relative depth from MDX)
    { href: '../installation/production/' },
    { href: '../getting-started/quick-start/' },
    { href: '../features/ai-gateway/' },
    { href: '../features/wasm-plugins/' },
  ];

  const actual = brokenLinks.filter(
    (bl) => !knownFalsePositivePatterns.some((fp) => bl.href === fp.href),
  );

  if (actual.length > 0) {
    const details = actual.map((bl) => `  ${bl.file} -> "${bl.href}" (resolved: ${bl.resolved})`).join('\n');
    assert.fail(`Found ${actual.length} broken internal link(s):\n${details}`);
  }
});

// ---------------------------------------------------------------------------
// Test suite: Placeholder text
// ---------------------------------------------------------------------------
test('no MDX files contain placeholder text patterns', () => {
  const mdxFiles = collectMdxFiles(docsRoot);
  const placeholderPatterns = [
    { pattern: /\bTODO\b/, label: 'TODO' },
    { pattern: /\bFIXME\b/, label: 'FIXME' },
    { pattern: /Lorem ipsum/i, label: 'Lorem ipsum' },
    { pattern: /\bTBD\b/, label: 'TBD' },
    { pattern: /Coming soon/i, label: 'Coming soon' },
  ];

  // Files that reference placeholder patterns as examples (e.g., contributing docs)
  const knownReferenceFiles = new Set([
    join(docsRoot, 'contributing/index.mdx'),
    join(docsRoot, 'zh/contributing/index.mdx'),
    join(docsRoot, '1.5/contributing/index.mdx'),
    join(docsRoot, 'zh/1.5/contributing/index.mdx'),
  ]);

  // Files where TBD is used as a legitimate CRD version status (not a placeholder)
  const tbdExemptFiles = new Set([
    join(docsRoot, 'configuration/experimental-features.mdx'),
    join(docsRoot, 'zh/configuration/experimental-features.mdx'),
    join(docsRoot, '1.5/configuration/experimental-features.mdx'),
    join(docsRoot, 'zh/1.5/configuration/experimental-features.mdx'),
  ]);

  const findings = [];

  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const isReferenceFile = knownReferenceFiles.has(filePath);
    const isTbdExempt = tbdExemptFiles.has(filePath);

    // Parse code blocks to avoid false positives in code examples
    let inCodeBlock = false;
    let codeBlockContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (isFenceLine(trimmed)) {
        if (inCodeBlock) {
          // Closing a code block - check its content
          const codeText = codeBlockContent.join('\n');
          for (const { pattern, label } of placeholderPatterns) {
            let match;
            while ((match = pattern.exec(codeText)) !== null) {
              if (isReferenceFile && (label === 'TODO' || label === 'FIXME')) continue;
              if (isTbdExempt && label === 'TBD') continue;
              findings.push({
                file: filePath.replace(docsRoot + '/', ''),
                line: i - codeBlockContent.length,
                label,
                context: match[0],
              });
            }
          }
          codeBlockContent = [];
          inCodeBlock = false;
        } else if (getFenceLanguage(trimmed) !== null) {
          // Opening fence with language - entering code block
          inCodeBlock = true;
          codeBlockContent = [];
        }
        continue;
      }

      if (inCodeBlock) {
        codeBlockContent.push(line);
        continue;
      }

      // Check non-code-block content for placeholder patterns
      for (const { pattern, label } of placeholderPatterns) {
        if (pattern.test(line)) {
          if (isReferenceFile && (label === 'TODO' || label === 'FIXME')) continue;
          if (isTbdExempt && label === 'TBD') continue;
          findings.push({
            file: filePath.replace(docsRoot + '/', ''),
            line: i + 1,
            label,
            context: line.trim().substring(0, 120),
          });
        }
      }
    }
  }

  if (findings.length > 0) {
    const details = findings
      .map((f) => `  ${f.file}:${f.line} — ${f.label}: "${f.context}"`)
      .join('\n');
    assert.fail(`Found ${findings.length} placeholder text pattern(s):\n${details}`);
  }
});

// ---------------------------------------------------------------------------
// Test suite: Code block language tags
// ---------------------------------------------------------------------------
test('no code blocks have invalid language tags', () => {
  const mdxFiles = collectMdxFiles(docsRoot);
  const untagged = [];
  const badLanguages = [];

  for (const filePath of mdxFiles) {
    const content = readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    let inCodeBlock = false;
    let codeBlockStartLine = 0;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();

      if (!isFenceLine(trimmed)) continue;

      if (!inCodeBlock) {
        // Opening fence
        inCodeBlock = true;
        codeBlockStartLine = i + 1;

        const language = getFenceLanguage(trimmed);
        if (!language) {
          untagged.push({
            file: filePath.replace(docsRoot + '/', ''),
            line: codeBlockStartLine,
            fence: trimmed,
          });
        }
      } else {
        // Closing fence
        inCodeBlock = false;
      }
    }
  }

  // Log untagged blocks for review, but don't fail — they are CLI output blocks
  if (untagged.length > 0) {
    console.log(`\n\u2139 ${untagged.length} code block(s) without language tags (CLI output, allowed):`);
    for (const v of untagged.slice(0, 5)) {
      console.log(`  ${v.file}:${v.line}`);
    }
    if (untagged.length > 5) {
      console.log(`  ... and ${untagged.length - 5} more`);
    }
  }
});