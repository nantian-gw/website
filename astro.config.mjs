import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import starlightVersions from 'starlight-versions';
import pagefind from 'astro-pagefind';
import { docsSidebar } from './src/config/docsSidebar.js';

export default defineConfig({
  site: 'https://nantian.dev',
  markdown: {
    gfm: true,
    rehypePlugins: [rehypeMermaid],
  },
  integrations: [
    starlight({
      title: 'Nantian Gateway',
      description:
        'Nantian Gateway — High-performance Kubernetes Gateway API implementation with Go control plane, Rust data plane, and built-in AI gateway capabilities.',
      routeMiddleware: ['./src/starlightRouteData.ts'],
      logo: { src: './src/assets/logo.svg' },
      plugins: [
        starlightVersions({
          versions: [{ slug: '1.5' }],
        }),
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        },
        zh: {
          label: '中文',
          lang: 'zh-CN',
        },
      },
      sidebar: docsSidebar,
      components: {
        Banner: './src/components/docs/Banner.astro',
        Footer: './src/components/docs/Footer.astro',
        Head: './src/components/docs/Head.astro',
      },
      editLink: {
        baseUrl: 'https://github.com/nantian-gw/website/edit/main/',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/nantian-gw/gateway' },
      ],
      head: [
        {
          tag: 'meta',
          attrs: { property: 'og:image', content: 'https://nantian.dev/og-image.png' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:width', content: '1200' },
        },
        {
          tag: 'meta',
          attrs: { property: 'og:image:height', content: '630' },
        },
        {
          tag: 'meta',
          attrs: { name: 'twitter:image', content: 'https://nantian.dev/og-image.png' },
        },
        {
          tag: 'meta',
          attrs: { name: 'robots', content: 'index, follow, max-image-preview:large' },
        },
      ],
      customCss: ['./src/styles/custom.css'],
    }),
    pagefind(),
  ],
  vite: {},
});
