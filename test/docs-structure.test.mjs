import assert from 'node:assert/strict';
import { existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, posix } from 'node:path';
import test from 'node:test';

import { docsSidebar } from '../src/config/docsSidebar.js';

const docsRoot = fileURLToPath(new URL('../src/content/docs', import.meta.url));
const zhRoot = fileURLToPath(new URL('../src/content/docs/zh', import.meta.url));
const versionRoot = fileURLToPath(new URL('../src/content/docs/1.5', import.meta.url));
const zhVersionRoot = fileURLToPath(new URL('../src/content/docs/zh/1.5', import.meta.url));

function collectMdxFiles(dir, base = dir) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      files.push(...collectMdxFiles(entryPath, base));
      continue;
    }

    if (!entry.isFile() || !entry.name.endsWith('.mdx')) {
      continue;
    }

    files.push(entryPath.slice(base.length + 1).split('\\').join(posix.sep));
  }

  return files.sort();
}

function flattenSidebar(items, parents = []) {
  return items.flatMap((item) => {
    const labelTrail = [...parents, item.label];
    const entry = {
      labelPath: labelTrail.join(' > '),
      label: item.label,
      translations: item.translations ?? {},
      link: item.link,
    };

    if (!item.items) {
      return [entry];
    }

    return [entry, ...flattenSidebar(item.items, labelTrail)];
  });
}

function linkToDocPath(link) {
  return link.endsWith('/') ? `${link}index.mdx` : `${link}.mdx`;
}

function currentEnglishDocs() {
  return collectMdxFiles(docsRoot).filter((path) => !path.startsWith('1.5/') && !path.startsWith('zh/'));
}

function currentChineseDocs() {
  return collectMdxFiles(zhRoot).filter((path) => !path.startsWith('1.5/'));
}

function assertMirroredDocs(sourcePaths, mirrorPaths, sourceLabel, mirrorLabel) {
  const mirrorSet = new Set(mirrorPaths);
  const sourceSet = new Set(sourcePaths);
  const missing = sourcePaths.filter((path) => !mirrorSet.has(path));
  const extra = mirrorPaths.filter((path) => !sourceSet.has(path));

  assert.equal(
    missing.length,
    0,
    `${mirrorLabel} is missing mirrored docs from ${sourceLabel}: ${missing.join(', ')}`,
  );
  assert.equal(
    extra.length,
    0,
    `${mirrorLabel} has docs not present in ${sourceLabel}: ${extra.join(', ')}`,
  );
}

function assertSidebarDocs(entries) {
  for (const entry of entries) {
    assert.ok(entry.translations['zh-CN'], `${entry.labelPath} is missing a zh-CN translation`);

    if (!entry.link) {
      continue;
    }

    const docPath = linkToDocPath(entry.link);
    assert.ok(existsSync(join(docsRoot, docPath)), `${entry.labelPath} is missing English doc ${docPath}`);
    assert.ok(existsSync(join(zhRoot, docPath)), `${entry.labelPath} is missing Chinese doc ${docPath}`);
  }
}

function assertIntentionalDrift(currentPaths, archivedPaths, expectedCurrentOnly, expectedArchivedOnly, currentLabel, archivedLabel) {
  const currentOnly = currentPaths.filter((path) => !archivedPaths.includes(path)).sort();
  const archivedOnly = archivedPaths.filter((path) => !currentPaths.includes(path)).sort();

  assert.deepEqual(
    currentOnly,
    expectedCurrentOnly,
    `${currentLabel} differs from ${archivedLabel} beyond the approved current-only set`,
  );
  assert.deepEqual(
    archivedOnly,
    expectedArchivedOnly,
    `${archivedLabel} differs from ${currentLabel} beyond the approved archived-only set`,
  );
}

test('current English and Chinese docs stay path-mirrored', () => {
  assertMirroredDocs(currentEnglishDocs(), currentChineseDocs(), 'current English docs', 'current Chinese docs');
});

test('versioned English and Chinese docs stay path-mirrored', () => {
  assertMirroredDocs(collectMdxFiles(versionRoot), collectMdxFiles(zhVersionRoot), 'versioned English docs', 'versioned Chinese docs');
});

test('current and versioned docs only differ by the approved drift set', () => {
  const expectedCurrentOnly = [
    'concepts/gateway-api-support.mdx',
    'concepts/glossary.mdx',
    'concepts/ir.mdx',
    'configuration/backend-lb-policy.mdx',
    'configuration/cert-manager.mdx',
    'features/ai-gateway/ab-testing.mdx',
    'features/ai-gateway/content-safety.mdx',
    'features/ai-gateway/cost-tracking.mdx',
    'features/ai-gateway/fallback.mdx',
    'features/ai-gateway/langfuse.mdx',
    'features/ai-gateway/model-routing.mdx',
    'features/ai-gateway/multitenant.mdx',
    'features/ai-gateway/pii-masking.mdx',
    'features/ai-gateway/prompt-guard.mdx',
    'features/ai-gateway/semantic-cache.mdx',
    'features/ai-gateway/token-policy.mdx',
    'guides/circuit-breaker.mdx',
    'guides/grpc-routes.mdx',
    'guides/ingress-migration.mdx',
    'guides/load-balancing.mdx',
    'guides/request-mirroring.mdx',
    'guides/retry.mdx',
    'guides/session-persistence.mdx',
    'guides/stream-routes.mdx',
    'guides/wasm-plugin-dev.mdx',
    'operations/dashboard.mdx',
    'operations/network-policy.mdx',
    'operations/prometheus-setup.mdx',
    'operations/scaling.mdx',
  ];
  const expectedArchivedOnly = [];

  assertIntentionalDrift(
    currentEnglishDocs(),
    collectMdxFiles(versionRoot),
    expectedCurrentOnly,
    expectedArchivedOnly,
    'current English docs',
    'versioned English docs',
  );
  assertIntentionalDrift(
    currentChineseDocs(),
    collectMdxFiles(zhVersionRoot),
    expectedCurrentOnly,
    expectedArchivedOnly,
    'current Chinese docs',
    'versioned Chinese docs',
  );
});

test('sidebar links resolve to real docs files and keep zh-CN translations', () => {
  assertSidebarDocs(flattenSidebar(docsSidebar));
});
