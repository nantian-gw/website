const MAX_META_DESCRIPTION_LENGTH = 160;
const META_LOOKUP_KEYS = ['name', 'property', 'http-equiv'] as const;
const BLOCKLIST = [
  /^---$/,
  /^#{1,6}\s/,
  /^:::.*$/,
  /^```/,
  /^import\s+/,
  /^export\s+/,
  /^\|.*\|$/,
  /^>/,
];

export const DEFAULT_DOCS_DESCRIPTION =
  'Nantian Gateway — High-performance Kubernetes Gateway API implementation with Go control plane, Rust data plane, and built-in AI gateway capabilities.';

type HeadEntry = {
  tag: string;
  attrs?: Record<string, string | boolean | undefined>;
  content?: string;
};

function normalizeParagraph(paragraph: string) {
  return paragraph
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !BLOCKLIST.some((pattern) => pattern.test(line)))
    .join(' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncateDescription(text: string) {
  if (text.length <= MAX_META_DESCRIPTION_LENGTH) return text;
  return `${text.slice(0, MAX_META_DESCRIPTION_LENGTH - 3).trimEnd()}...`;
}

function findMetaIndex(head: HeadEntry[], attrs: Record<string, string>) {
  for (const key of META_LOOKUP_KEYS) {
    const value = attrs[key];
    if (!value) continue;
    return head.findIndex((entry) => entry.tag === 'meta' && entry.attrs?.[key] === value);
  }

  return -1;
}

export function extractDocsSummary(body: string) {
  for (const paragraph of body.split(/\n{2,}/)) {
    const normalized = normalizeParagraph(paragraph);
    if (!normalized) continue;
    return truncateDescription(normalized);
  }

  return null;
}

export function upsertDocsMeta(head: HeadEntry[], description: string) {
  const entries: HeadEntry[] = [
    { tag: 'meta', attrs: { name: 'description', content: description } },
    { tag: 'meta', attrs: { property: 'og:description', content: description } },
    { tag: 'meta', attrs: { name: 'twitter:description', content: description } },
  ];

  for (const entry of entries) {
    const index = findMetaIndex(head, entry.attrs as Record<string, string>);
    if (index >= 0) {
      head[index] = entry;
    } else {
      head.push(entry);
    }
  }
}
