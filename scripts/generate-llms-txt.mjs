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

import { docsSidebar } from "../src/config/docsSidebar.js";

const defaultDistDir = process.argv[2] || "dist";
const siteUrl = "https://nantian.dev";

function normalizePagePath(link) {
  return link.replace(/^\/+/, "").replace(/\/?$/, "/");
}

function flattenSidebarItems(items) {
  const pages = [];

  for (const item of items) {
    if (item.link) {
      pages.push({
        label: item.label,
        path: normalizePagePath(item.link),
      });
    }

    if (item.items) {
      pages.push(...flattenSidebarItems(item.items));
    }
  }

  return pages;
}

export function sidebarSectionsFromConfig(sidebar = docsSidebar) {
  return sidebar
    .map((section) => ({
      label: section.label,
      pages: flattenSidebarItems(section.items ?? []),
    }))
    .filter((section) => section.pages.length > 0);
}

function readHtml(distDir, path) {
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

export function generateLlmsTxt(distDir = defaultDistDir, sidebar = docsSidebar) {
  const sidebarSections = sidebarSectionsFromConfig(sidebar);
  let llms = `# Nantian Gateway
> High-performance Kubernetes Gateway API implementation with Go control plane, Rust data plane, and built-in AI gateway capabilities.

`;

  for (const section of sidebarSections) {
    llms += `## ${section.label}\n`;
    for (const page of section.pages) {
      const html = readHtml(distDir, page.path);
      const { title, description } = extractMeta(html);
      const displayTitle = title || page.label || page.path.replace(/\/$/, "").split("/").pop();
      const desc = description ? `: ${description}` : "";
      llms += `- [${displayTitle}](${siteUrl}/${page.path})${desc}\n`;
    }
    llms += "\n";
  }

  llms +=
    "Current Helm chart facts: the Helm chart is published at https://chart.nantian.dev, lives in helm-charts/charts/nantian-gw, defaults to featureMode: standard, does not render Gateway API CRDs unless gatewayAPI.installCRDs=true, uses the latest tag for controlplane, dataplane, and dashboard images by default, and production values should pin immutable release tags or digests.\n";

  writeFileSync(join(distDir, "llms.txt"), llms);
  console.log(`Generated ${join(distDir, "llms.txt")} (${llms.length} bytes)`);
  return llms;
}

export function generateLlmsFullTxt(distDir = defaultDistDir, sidebar = docsSidebar) {
  const sidebarSections = sidebarSectionsFromConfig(sidebar);
  const parts = ["# Nantian Gateway — Full Documentation\n\n"];

  for (const section of sidebarSections) {
    for (const page of section.pages) {
      const html = readHtml(distDir, page.path);
      const text = extractText(html);
      if (text && text.length > 50) {
        parts.push(`## ${page.path}\n\n${text}\n\n`);
      }
    }
  }

  const full = parts.join("");
  writeFileSync(join(distDir, "llms-full.txt"), full);
  console.log(
    `Generated ${join(distDir, "llms-full.txt")} (${full.length} bytes)`
  );
  return full;
}

export function main(distDir = defaultDistDir) {
  console.log("Generating llms.txt files from built site...");
  generateLlmsTxt(distDir);
  generateLlmsFullTxt(distDir);
  console.log("Done.");
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main();
}
