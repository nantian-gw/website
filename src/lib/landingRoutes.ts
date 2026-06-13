const SITE_URL = "https://nantian.dev";

const alternatePathByPath: Record<string, string> = {
  "/": "/zh/",
  "/about/": "/zh/about/",
  "/contact/": "/zh/contact/",
  "/privacy/": "/zh/privacy/",
  "/terms/": "/zh/terms/",
  "/zh/": "/",
  "/zh/about/": "/about/",
  "/zh/contact/": "/contact/",
  "/zh/privacy/": "/privacy/",
  "/zh/terms/": "/terms/",
};

export type LandingLang = "en" | "zh";

export function normalizeLandingPath(pathname: string): string {
  if (!pathname) return "/";
  return pathname.endsWith("/") ? pathname : `${pathname}/`;
}

export function getLandingLang(pathname: string): LandingLang {
  const normalizedPath = normalizeLandingPath(pathname);
  return normalizedPath === "/zh/" || normalizedPath.startsWith("/zh/") ? "zh" : "en";
}

export function toAbsoluteSiteUrl(pathname: string): string {
  return new URL(normalizeLandingPath(pathname), SITE_URL).toString();
}

export function getAlternateLandingPath(pathname: string): string | null {
  return alternatePathByPath[normalizeLandingPath(pathname)] ?? null;
}

export function getLandingRouteMeta(pathname: string) {
  const normalizedPath = normalizeLandingPath(pathname);
  const lang = getLandingLang(normalizedPath);
  const alternatePath = getAlternateLandingPath(normalizedPath);
  const xDefaultPath =
    lang === "en"
      ? normalizedPath
      : alternatePath && getLandingLang(alternatePath) === "en"
        ? alternatePath
        : "/";

  return {
    lang,
    canonicalUrl: toAbsoluteSiteUrl(normalizedPath),
    homePath: lang === "zh" ? "/zh/" : "/",
    alternatePath,
    alternateUrl: alternatePath ? toAbsoluteSiteUrl(alternatePath) : null,
    xDefaultUrl: toAbsoluteSiteUrl(xDefaultPath),
  };
}
