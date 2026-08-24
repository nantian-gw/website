import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const DOCS_ROOT = join(__dirname, "..", "src", "content", "docs");
const VERSIONED_DIR = "1.5";
const EXCLUDED_DIRS = new Set([VERSIONED_DIR, "zh"]);
export const DRIFT_THRESHOLD_PERCENT = 50;

/**
 * Recursively collect all file paths under a directory, relative to the root.
 */
function collectFiles(dir, root, exclude = new Set()) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (exclude.has(entry.name)) continue;
      files.push(...collectFiles(fullPath, root, exclude));
    } else if (entry.isFile()) {
      files.push(relative(root, fullPath));
    }
  }
  return files;
}

/**
 * Collect all file paths relative to `src/content/docs/` from the versioned snapshot directory.
 */
function collectVersionedFiles() {
  const versionedRoot = join(DOCS_ROOT, VERSIONED_DIR);
  const raw = collectFiles(versionedRoot, versionedRoot);
  // Normalize to forward slashes and strip the versioned prefix
  return raw.map((p) => p.replace(/\\/g, "/"));
}

/**
 * Collect all file paths relative to `src/content/docs/` from the live docs,
 * excluding the versioned snapshot directory (1.5/) and locale mirrors (zh/).
 */
function collectLiveFiles() {
  const raw = collectFiles(DOCS_ROOT, DOCS_ROOT, EXCLUDED_DIRS);
  return raw.map((p) => p.replace(/\\/g, "/"));
}

export function computeDrift(versionedFiles, liveFiles) {
  const versionedSet = new Set(versionedFiles);
  const drifted = liveFiles.filter((f) => !versionedSet.has(f));
  const total = liveFiles.length;
  const driftCount = drifted.length;
  const driftPercent = total > 0 ? (driftCount / total) * 100 : 0;

  return { drifted, driftCount, total, driftPercent };
}

export function main() {
  const versionedFiles = collectVersionedFiles();
  const liveFiles = collectLiveFiles();
  const { drifted, driftCount, total, driftPercent } = computeDrift(versionedFiles, liveFiles);

  console.log(`\n📄 Version Drift Report (1.5 snapshot vs live docs)`);
  console.log(`   Versioned snapshot files: ${versionedFiles.length}`);
  console.log(`   Live docs files (excl. 1.5/ and zh/): ${total}`);
  console.log(`   Drifted (new in live, missing from snapshot): ${driftCount}`);
  console.log(`   Drift percentage: ${driftPercent.toFixed(1)}%`);
  console.log(`   Threshold: ${DRIFT_THRESHOLD_PERCENT.toFixed(1)}%\n`);

  if (drifted.length > 0) {
    console.log("Drifted files:");
    for (const f of drifted) {
      console.log(`   + ${f}`);
    }
    console.log();
  }

  if (driftPercent > DRIFT_THRESHOLD_PERCENT) {
    console.error(`❌ FAIL: Drift ${driftPercent.toFixed(1)}% exceeds threshold of ${DRIFT_THRESHOLD_PERCENT}%`);
    process.exitCode = 1;
  } else {
    console.log(`✅ PASS: Drift ${driftPercent.toFixed(1)}% within threshold of ${DRIFT_THRESHOLD_PERCENT}%`);
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
