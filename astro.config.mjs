import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import rehypeMermaid from 'rehype-mermaid';
import starlightVersions from 'starlight-versions';
import pagefind from 'astro-pagefind';

const sidebar = [
  {
    label: 'Concepts',
    translations: { 'zh-CN': '概念' },
    items: [
      { label: 'Core Concepts', link: 'concepts/', translations: { 'zh-CN': '核心概念' } },
      { label: 'Gateway API', link: 'concepts/gateway-api', translations: { 'zh-CN': 'Gateway API' } },
      { label: 'Split-Plane Architecture', link: 'concepts/split-plane', translations: { 'zh-CN': '分离式平面架构' } },
    ],
  },
  {
    label: 'Overview',
    translations: { 'zh-CN': '概述' },
    items: [
      { label: 'What is Nantian Gateway', link: 'overview/', translations: { 'zh-CN': '什么是 Nantian Gateway' } },
      { label: 'Comparison', link: 'comparison', translations: { 'zh-CN': '项目对比' } },
      { label: 'Use Cases', link: 'use-cases', translations: { 'zh-CN': '适用场景' } },
    ],
  },
  {
    label: 'Features',
    translations: { 'zh-CN': '功能' },
    items: [
      { label: 'Overview', link: 'features/', translations: { 'zh-CN': '概述' } },
      { label: 'AI Gateway', link: 'features/ai-gateway', translations: { 'zh-CN': 'AI 网关' } },
      { label: 'Wasm Plugins', link: 'features/wasm-plugins', translations: { 'zh-CN': 'Wasm 插件' } },
      { label: 'Traffic Management', link: 'features/traffic-management', translations: { 'zh-CN': '流量治理' } },
      { label: 'Security And Observability', link: 'features/security-observability', translations: { 'zh-CN': '安全与可观测性' } },
    ],
  },
  {
    label: 'Getting Started',
    translations: { 'zh-CN': '快速开始' },
    items: [
      { label: 'Prerequisites', link: 'getting-started/prerequisites', translations: { 'zh-CN': '环境要求' } },
      { label: 'Quick Start (5 min)', link: 'getting-started/quick-start', translations: { 'zh-CN': '5 分钟部署' } },
      { label: 'Your First Route', link: 'getting-started/first-route', translations: { 'zh-CN': '第一个路由' } },
    ],
  },
  {
    label: 'Installation',
    translations: { 'zh-CN': '安装' },
    items: [
      { label: 'Overview', link: 'installation/', translations: { 'zh-CN': '概述' } },
      { label: 'Helm', link: 'installation/helm', translations: { 'zh-CN': 'Helm' } },
      { label: 'Kustomize', link: 'installation/kustomize', translations: { 'zh-CN': 'Kustomize' } },
      { label: 'Production', link: 'installation/production', translations: { 'zh-CN': '生产环境' } },
      { label: 'High Availability', link: 'installation/ha', translations: { 'zh-CN': '高可用' } },
      { label: 'Upgrade Guide', link: 'installation/upgrade', translations: { 'zh-CN': '升级指南' } },
    ],
  },
  {
    label: 'Configuration',
    translations: { 'zh-CN': '配置' },
    items: [
      { label: 'Overview', link: 'configuration/', translations: { 'zh-CN': '概述' } },
      { label: 'Experimental Features', link: 'configuration/experimental-features', translations: { 'zh-CN': '实验功能' } },
      { label: 'Control Plane', link: 'configuration/controlplane', translations: { 'zh-CN': '控制面' } },
      { label: 'Data Plane', link: 'configuration/dataplane', translations: { 'zh-CN': '数据面' } },
      { label: 'TLS / mTLS', link: 'configuration/tls', translations: { 'zh-CN': 'TLS / mTLS' } },
      { label: 'gRPC xDS', link: 'configuration/xds', translations: { 'zh-CN': 'gRPC xDS' } },
      { label: 'Observability', link: 'configuration/observability', translations: { 'zh-CN': '可观测性' } },
      { label: 'Tuning', link: 'configuration/tuning', translations: { 'zh-CN': '性能调优' } },
    ],
  },
  {
    label: 'Architecture',
    translations: { 'zh-CN': '架构' },
    items: [
      { label: 'Overview', link: 'architecture/', translations: { 'zh-CN': '整体架构' } },
      { label: 'Control Plane', link: 'architecture/controlplane', translations: { 'zh-CN': '控制面设计' } },
      { label: 'Data Plane', link: 'architecture/dataplane', translations: { 'zh-CN': '数据面设计' } },
      { label: 'Admin API', link: 'architecture/admin-api', translations: { 'zh-CN': 'Admin API' } },
    ],
  },
  {
    label: 'Operations',
    translations: { 'zh-CN': '运维' },
    items: [
      { label: 'Overview', link: 'operations/', translations: { 'zh-CN': '概述' } },
      { label: 'Metrics Reference', link: 'operations/metrics', translations: { 'zh-CN': '指标参考' } },
      { label: 'Grafana Dashboard', link: 'operations/grafana', translations: { 'zh-CN': 'Grafana 仪表盘' } },
      { label: 'Alerting Rules', link: 'operations/alerting', translations: { 'zh-CN': '告警规则' } },
      { label: 'Troubleshooting', link: 'operations/troubleshooting', translations: { 'zh-CN': '故障排查' } },
      { label: 'Backup & Recovery', link: 'operations/backup', translations: { 'zh-CN': '备份与恢复' } },
    ],
  },
  {
    label: 'API Reference',
    translations: { 'zh-CN': 'API 参考' },
    items: [
      { label: 'Overview', link: 'api-reference/', translations: { 'zh-CN': '概述' } },
      { label: 'Gateway API Resources', link: 'api-reference/gateway-api', translations: { 'zh-CN': 'Gateway API 资源' } },
      { label: 'Custom CRDs', link: 'api-reference/crds', translations: { 'zh-CN': '自定义 CRD' } },
      { label: 'Admin API', link: 'api-reference/admin-api', translations: { 'zh-CN': 'Admin API' } },
      { label: 'xDS Protocol', link: 'api-reference/xds-proto', translations: { 'zh-CN': 'xDS 协议' } },
    ],
  },
  {
    label: 'Contributing',
    translations: { 'zh-CN': '贡献指南' },
    items: [
      { label: 'Overview', link: 'contributing/', translations: { 'zh-CN': '概述' } },
      { label: 'Development Setup', link: 'contributing/development', translations: { 'zh-CN': '开发环境' } },
      { label: 'Testing Guide', link: 'contributing/testing', translations: { 'zh-CN': '测试指南' } },
      { label: 'Release Process', link: 'contributing/release', translations: { 'zh-CN': '发布流程' } },
    ],
  },
  {
    label: 'FAQ',
    translations: { 'zh-CN': 'FAQ' },
    items: [
      { label: 'Frequently Asked Questions', link: 'faq/', translations: { 'zh-CN': '常见问题' } },
    ],
  },
];

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
      sidebar,
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
