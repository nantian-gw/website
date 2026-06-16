import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { DEFAULT_DOCS_DESCRIPTION, extractDocsSummary, upsertDocsMeta } from './lib/docsSeo';

export const onRequest = defineRouteMiddleware(async ({ locals }, next) => {
  await next();

  const route = locals.starlightRoute;
  if (route.entry.collection !== 'docs') return;

  const description =
    route.entry.data.description?.trim() ||
    extractDocsSummary(route.entry.body ?? '') ||
    DEFAULT_DOCS_DESCRIPTION;

  upsertDocsMeta(route.head, description);
});
