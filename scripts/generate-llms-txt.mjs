/**
 * Post-build script: generates public/llms.txt and public/llms-full.txt
 * from the built Astro/Starlight documentation site.
 *
 * llms.txt: structured index with page titles and descriptions
 * llms-full.txt: full text content of all documentation pages
 *
 * Usage: node scripts/generate-llms-txt.mjs [dist-dir]
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = process.argv[2] || "dist";
const siteUrl = "https://nantian.dev";

// Page structure from sidebar — section labels and their pages
const sidebarSections = [
  {
    label: "Concepts",
    pages: ["concepts/", "concepts/gateway-api/", "concepts/split-plane/"],
  },
  {
    label: "Overview",
    pages: ["overview/", "comparison/", "use-cases/"],
  },
  {
    label: "Features",
    pages: [
      "features/",
      "features/ai-gateway/",
      "features/wasm-plugins/",
      "features/traffic-management/",
      "features/security-observability/",
    ],
  },
  {
    label: "Getting Started",
    pages: [
      "getting-started/prerequisites/",
      "getting-started/quick-start/",
      "getting-started/first-route/",
    ],
  },
  {
    label: "Installation",
    pages: [
      "installation/",
      "installation/helm/",
      "installation/kustomize/",
      "installation/production/",
      "installation/ha/",
      "installation/upgrade/",
    ],
  },
  {
    label: "Configuration",
    pages: [
      "configuration/",
      "configuration/helm-values/",
      "configuration/experimental-features/",
      "configuration/controlplane/",
      "configuration/dataplane/",
      "configuration/tls/",
      "configuration/xds/",
      "configuration/observability/",
      "configuration/tuning/",
    ],
  },
  {
    label: "Architecture",
    pages: [
      "architecture/",
      "architecture/controlplane/",
      "architecture/dataplane/",
      "architecture/admin-api/",
    ],
  },
  {
    label: "Operations",
    pages: [
      "operations/",
      "operations/metrics/",
      "operations/grafana/",
      "operations/alerting/",
      "operations/troubleshooting/",
      "operations/backup/",
    ],
  },
  {
    label: "API Reference",
    pages: [
      "api-reference/",
      "api-reference/gateway-api/",
      "api-reference/crds/",
      "api-reference/admin-api/",
      "api-reference/xds-proto/",
    ],
  },
  {
    label: "Contributing",
    pages: [
      "contributing/",
      "contributing/development/",
      "contributing/testing/",
      "contributing/release/",
    ],
  },
  {
    label: "FAQ",
    pages: ["faq/"],
  },
];

function readHtml(path) {
  try {
    return readFileSync(join(distDir, path, "index.html"), "utf8");
  } catch {
    return null;
  }
}

function extractMeta(html) {
  if (!html) return { title: "", description: "" };

  const titleMatch = html.match(/<title>([^<]+)<\/title>/);
  const title = titleMatch
    ? titleMatch[1].replace(" — Nantian Gateway", "").trim()
    : "";

  const descMatch = html.match(
    /<meta\s+name="description"\s+content="([^"]+)"/i
  );
  const description = descMatch ? descMatch[1] : "";

  return { title, description };
}

function extractText(html) {
  if (!html) return "";
  // Strip HTML tags, scripts, styles
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

function generateLlmsTxt() {
  let llms = `# Nantian Gateway
> High-performance Kubernetes Gateway API implementation with Go control plane, Rust data plane, and built-in AI gateway capabilities.

`;

  for (const section of sidebarSections) {
    llms += `## ${section.label}\n`;
    for (const page of section.pages) {
      const html = readHtml(page);
      const { title, description } = extractMeta(html);
      const displayTitle = title || page.replace(/\/$/, "").split("/").pop();
      const desc = description ? `: ${description}` : "";
      llms += `- [${displayTitle}](${siteUrl}/${page})${desc}\n`;
    }
    llms += "\n";
  }

  llms +=
    "Current Helm chart facts: the Helm chart is published at https://chart.nantian.dev, lives in helm-charts/charts/nantian-gw, defaults to featureMode: standard, does not render Gateway API CRDs unless gatewayAPI.installCRDs=true, uses the latest tag for controlplane, dataplane, and dashboard images by default, and production values should pin immutable release tags or digests.\n";

  writeFileSync(join(distDir, "llms.txt"), llms);
  console.log(`Generated ${join(distDir, "llms.txt")} (${llms.length} bytes)`);
}

function generateLlmsFullTxt() {
  const parts = ["# Nantian Gateway — Full Documentation\n\n"];

  for (const section of sidebarSections) {
    for (const page of section.pages) {
      const html = readHtml(page);
      const text = extractText(html);
      if (text && text.length > 50) {
        parts.push(`## ${page}\n\n${text}\n\n`);
      }
    }
  }

  const full = parts.join("");
  writeFileSync(join(distDir, "llms-full.txt"), full);
  console.log(
    `Generated ${join(distDir, "llms-full.txt")} (${full.length} bytes)`
  );
}

function main() {
  console.log("Generating llms.txt files from built site...");
  generateLlmsTxt();
  generateLlmsFullTxt();
  console.log("Done.");
}

main();
