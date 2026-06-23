/**
 * Cloudflare Pages Worker — content negotiation for markdown.
 *
 * When a request's Accept header includes "text/markdown", this worker
 * serves the raw .md file (generated at build time) instead of HTML.
 *
 * URL mapping:
 *   /concepts/                → /concepts.md
 *   /concepts/split-plane/    → /concepts/split-plane.md
 *   /zh/concepts/             → /zh/concepts.md
 */

export default {
  async fetch(request, env) {
    const accept = request.headers.get("Accept") || "";

    // Only intercept markdown-requesting clients
    if (!accept.includes("text/markdown")) {
      return env.ASSETS.fetch(request);
    }

    const url = new URL(request.url);
    let path = url.pathname;

    // Strip trailing slash
    if (path.endsWith("/")) {
      path = path.slice(0, -1);
    }

    // Root maps to index.md
    if (path === "") {
      path = "/index";
    }

    // Try the .md version
    const mdPath = `${path}.md`;
    const mdRequest = new Request(new URL(mdPath, url.origin), request);
    const response = await env.ASSETS.fetch(mdRequest);

    if (response.ok) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/markdown; charset=utf-8",
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Fall back to normal HTML response
    return env.ASSETS.fetch(request);
  },
};
