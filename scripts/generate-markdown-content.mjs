import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join, dirname, basename } from "node:path";

const docsDir = "src/content/docs";
const distDir = process.argv[2] || "dist";

function stripFrontmatter(content) {
  const lines = content.split("\n");
  if (!lines[0] || !lines[0].trim().startsWith("---")) return content;
  let end = 1;
  while (end < lines.length) {
    if (lines[end].trim() === "---") return lines.slice(end + 1).join("\n");
    end++;
  }
  return content;
}

function sourceToOutput(sourcePath) {
  const rel = sourcePath.replace(docsDir + "/", "").replace(/\.mdx$/, "");
  if (basename(rel) === "index") return join(distDir, `${dirname(rel)}.md`);
  return join(distDir, `${rel}.md`);
}

function walk(dir) {
  const results = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) results.push(...walk(full));
    else if (entry.endsWith(".mdx")) results.push(full);
  }
  return results;
}

const sourceFiles = walk(docsDir);
let count = 0;

for (const sourceFile of sourceFiles) {
  const content = readFileSync(sourceFile, "utf-8");
  const markdown = stripFrontmatter(content);
  const outputPath = sourceToOutput(sourceFile);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, markdown.trimStart(), "utf-8");
  count++;
}

writeFileSync(join(distDir, "index.md"),
  "# Nantian Gateway\n\n" +
  "High-performance Kubernetes Gateway API implementation with Go control plane, " +
  "Rust data plane, and built-in AI gateway capabilities.\n\n" +
  "[Documentation](https://nantian.dev/concepts/)\n" +
  "[GitHub](https://github.com/nantian-gw/gateway)\n",
  "utf-8");
count++;

console.log(`Generated ${count} markdown files in ${distDir}/`);
