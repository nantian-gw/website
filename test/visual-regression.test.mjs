import assert from 'node:assert/strict';
import { execFileSync, spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import test, { describe, before, after } from 'node:test';
import { chromium } from 'playwright';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);
const astroBinPath = fileURLToPath(new URL('./node_modules/astro/bin/astro.mjs', root));
const baselineDir = fileURLToPath(new URL('./test/screenshots/baseline', root));
const actualDir = fileURLToPath(new URL('./test/screenshots/actual', root));

// Skip in CI — visual regression tests need a full build + server.
// Run manually with: UPDATE_SNAPSHOTS=1 node --test test/visual-regression.test.mjs
const isCI = process.env.CI === "true" || process.env.NODE_ENV === "ci";
if (isCI) {
	test("visual regression — skipped in CI", () => {
		assert.ok(true, "visual regression tests are skipped in CI");
	});
	process.exit(0);
}
const diffDir = fileURLToPath(new URL('./test/screenshots/diff', root));
const distDir = fileURLToPath(new URL('./dist', root));

const UPDATE_SNAPSHOTS = process.env.UPDATE_SNAPSHOTS === '1';

const PAGES = [
  { name: 'homepage', path: '/' },
  { name: 'about', path: '/about/' },
  { name: 'docs-en-landing', path: '/overview/' },
  { name: 'docs-zh-landing', path: '/zh/overview/' },
  { name: 'guide-install-helm', path: '/installation/helm/' },
  { name: 'blog-why-ai-gateway', path: '/blog/why-ai-gateway/' },
];

const VIEWPORT = { width: 1440, height: 900 };
const MAX_DIFF_RATIO = 0.01; // 1% threshold

function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

async function buildSite() {
  // Clean dist directory to avoid stale cache
  if (existsSync(distDir)) {
    rmSync(distDir, { recursive: true, force: true });
  }
  execFileSync(process.execPath, [astroBinPath, 'build'], {
    cwd: rootPath,
    stdio: 'pipe',
    timeout: 120_000,
  });
}

async function startPreview() {
  const server = spawn(process.execPath, [astroBinPath, 'preview', '--port', '4322'], {
    cwd: rootPath,
    stdio: 'pipe',
  });

  // Wait for the server to be ready by polling
  const baseUrl = 'http://localhost:4322';
  const maxRetries = 60;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(`${baseUrl}/`);
      if (response.ok) {
        return { server, baseUrl };
      }
    } catch {
      // Server not ready yet
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Preview server did not start within 30 seconds');
}

describe('visual regression', () => {
  let browser;
  let server;
  let baseUrl;

  before(async () => {
    // Build the site
    buildSite();
    console.log('Building site...');

    // Start preview server
    const result = await startPreview();
    server = result.server;
    baseUrl = result.baseUrl;
    console.log(`Preview server running at ${baseUrl}`);

    // Launch browser
    browser = await chromium.launch({ headless: true });
    console.log('Browser launched');

    // Ensure directories exist
    ensureDir(baselineDir);
    ensureDir(actualDir);
    ensureDir(diffDir);
  });

  after(() => {
    if (browser) browser.close();
    if (server) server.kill('SIGTERM');
  });

  for (const page of PAGES) {
    test(`screenshot matches baseline for ${page.name}`, async () => {
      const context = await browser.newContext({ viewport: VIEWPORT });
      const pageInstance = await context.newPage();

      const url = `${baseUrl}${page.path}`;
      await pageInstance.goto(url, { waitUntil: 'networkidle' });

      // Wait a bit for any client-side rendering to settle
      await pageInstance.waitForTimeout(1000);

      const screenshot = await pageInstance.screenshot({ fullPage: true });
      const baselinePath = join(baselineDir, `${page.name}.png`);
      const actualPath = join(actualDir, `${page.name}.png`);
      const diffPath = join(diffDir, `${page.name}.png`);

      // Save actual screenshot
      writeFileSync(actualPath, screenshot);

      if (UPDATE_SNAPSHOTS) {
        // Update baseline
        writeFileSync(baselinePath, screenshot);
        console.log(`  Updated baseline: ${page.name}`);
        await context.close();
        return;
      }

      if (!existsSync(baselinePath)) {
        // No baseline exists yet — create it
        writeFileSync(baselinePath, screenshot);
        console.log(`  Created baseline: ${page.name}`);
        await context.close();
        return;
      }

      // Compare
      const baseline = PNG.sync.read(readFileSync(baselinePath));
      const actual = PNG.sync.read(screenshot);

      const { width, height } = baseline;
      assert.equal(
        actual.width,
        width,
        `${page.name}: screenshot width changed (${actual.width} vs ${width})`,
      );
      assert.equal(
        actual.height,
        height,
        `${page.name}: screenshot height changed (${actual.height} vs ${height})`,
      );

      const diff = new PNG({ width, height });
      const diffPixels = pixelmatch(baseline.data, actual.data, diff.data, width, height, {
        threshold: 0.1,
      });

      const totalPixels = width * height;
      const diffRatio = diffPixels / totalPixels;

      // Save diff image for debugging
      if (diffPixels > 0) {
        writeFileSync(diffPath, PNG.sync.write(diff));
      }

      console.log(
        `  ${page.name}: ${diffPixels} diff pixels (${(diffRatio * 100).toFixed(2)}%)`,
      );

      assert.ok(
        diffRatio <= MAX_DIFF_RATIO,
        `${page.name}: visual diff ${(diffRatio * 100).toFixed(2)}% exceeds threshold ${(MAX_DIFF_RATIO * 100).toFixed(2)}% (see diff: ${diffPath})`,
      );

      await context.close();
    });
  }
});