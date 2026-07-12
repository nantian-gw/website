export type LandingLang = 'en' | 'zh';

const en = {
  hero: {
    heading: 'Nantian Gateway — Kubernetes Gateway API',
    subtitle: 'Kubernetes Gateway API control plane with a Rust data plane',
    tagline:
      'Standard Gateway API routing · Go control plane · gRPC/xDS · Experimental AI and Wasm extensions',
    quickStartLabel: 'Quick Start',
    quickStartHref: '/getting-started/quick-start/',
    comparisonHref: '/comparison/',
    faqHref: '/faq/',
    useCasesHref: '/use-cases/',
    comparisonLabel: 'Comparison',
    faqLabel: 'FAQ',
    useCasesLabel: 'Use Cases',
    ariaLabel: 'Hero banner',
  },
  homeIntro: {
    sectionTitle: 'Why Nantian Gateway',
    sectionSubtitle:
      'Next-generation API gateway for the cloud-native era, combining Go ecosystem with Rust performance',
    highlights: [
      {
        title: 'Split-Plane Architecture',
        desc: 'The Go control plane watches Kubernetes cluster state, translating Gateway, HTTPRoute, and Service resources into an internal routing model. The Rust data plane receives runtime snapshots via gRPC/xDS and handles every request with zero GC pauses. Both planes scale independently.',
      },
      {
        title: 'Native Gateway API Support',
        desc: 'Full implementation of Kubernetes Gateway API v1.5.1 with 54 declared conformance features. Supports GatewayClass, Gateway, HTTPRoute, GRPCRoute, TLSRoute, and more. API-compatible with Envoy Gateway, Istio, and other major implementations for minimal migration cost.',
      },
      {
        title: 'Extreme Performance & Efficiency',
        desc: 'The Rust data plane delivers tens of thousands of QPS per core with no GC and zero-cost abstractions. Low memory footprint (~15MB baseline) with millisecond startup times. Built-in connection pooling, zero-copy forwarding, and async I/O are battle-tested in production.',
      },
      {
        title: 'Experimental AI Gateway',
        desc: 'Built-in AIService and TokenPolicy resources unify API endpoints and credentials across multiple model providers (OpenAI, HuggingFace, etc.). Token-based rate limiting and quota management provide a single traffic entry point for AI applications, reducing multi-model integration complexity.',
      },
      {
        title: 'Extensible Wasm Plugin System',
        desc: 'WasmPlugin resources support URL, ConfigMap, or inline module sources. Plugins bind to specific Gateways or Routes for custom authentication, traffic coloring, request rewriting, and more — hot-loadable without restarting the gateway process.',
      },
      {
        title: 'Production-Grade Operations',
        desc: 'Admin API for runtime configuration queries and debugging. Built-in Prometheus metrics endpoints and Grafana dashboard templates. Health and readiness probes. One-click Helm Chart deployment with flexible Kustomize overlays for environments from bare metal to Kubernetes.',
      },
    ],
    bottomCta: {
      title: 'Get Started with Nantian Gateway',
      desc: 'Deploy in your Kubernetes cluster with a single Helm command. Gateway API standard, compatible with existing toolchains, up and running in 5 minutes.',
      linkText: 'View Quick Start →',
      linkHref: '/getting-started/quick-start/',
    },
    perfTitle: 'Performance Benchmarks',
    perfItems: [
      '30,000+ QPS per core with P99 latency under 5ms',
      'Memory footprint starts at 15MB with startup time under 50ms',
      'Startup time under 50ms with hot-reload for config and plugins',
      '10,000+ concurrent connections with zero-copy forwarding',
    ],
    communityTitle: 'Community & Ecosystem',
    communityItems: [
      'Apache 2.0 licensed — fully free for commercial use',
      'Active GitHub community — contributions welcome',
      'API-compatible with Envoy Gateway, Istio, and other major implementations',
      'Comprehensive documentation in English and Chinese, from getting started to production',
    ],
  },
  features: {
    sectionTitle: 'Core Features',
    sectionSubtitle: 'One platform for all your gateway needs',
    features: [
      {
        icon: '🚪',
        title: 'Gateway API v1.5.1',
        description:
          'Declared support is generated from the gateway repository support matrix and conformance profile',
        href: '/api-reference/gateway-api/',
      },
      {
        icon: '🤖',
        title: 'Experimental AI Gateway',
        description:
          'AIService and TokenPolicy are disabled by default and configure model providers and token policy when enabled',
        href: '/features/ai-gateway/',
      },
      {
        icon: '⚡',
        title: 'Split-plane Architecture',
        description:
          'The Go control plane watches Kubernetes resources; the Rust data plane receives runtime snapshots over gRPC/xDS',
        href: '/concepts/split-plane/',
      },
      {
        icon: '🔌',
        title: 'Experimental Wasm Extensions',
        description:
          'WasmPlugin supports URL, ConfigMap, or inline module sources bound to target resources',
        href: '/features/wasm-plugins/',
      },
      {
        icon: '📊',
        title: 'Operations Visibility',
        description:
          'Admin APIs, Prometheus metrics, Grafana dashboards, and health probe ports are part of the stack',
        href: '/features/security-observability/',
      },
      {
        icon: '🚀',
        title: 'Helm And Kustomize',
        description:
          'The Helm chart is published at chart.nantian.dev and repository-local Kustomize overlays are available',
        href: '/installation/',
      },
    ],
  },
  architecture: {
    sectionTitle: 'Architecture',
    sectionSubtitle:
      'Split-plane control plane and data plane communicating over gRPC xDS',
    imgAlt: 'Nantian Gateway Architecture Diagram',
  },
  codeExample: {
    heading: 'Quick Start in 5 Minutes',
    subtitle: 'One Helm command to install, one HTTPRoute resource to route traffic',
    step1Label: '① Install the Gateway',
    step2Label: '② Create Your First Route',
    docLinkText: '📖 Full Documentation →',
    docLinkHref: '/getting-started/quick-start/',
  },
  comparison: {
    heading: 'Why Nantian Gateway?',
    subtitle: 'How Nantian compares to other Gateway API implementations',
    detailLinkText: '🔬 Full Comparison →',
    detailLinkHref: '/comparison/',
    rows: [
      { feature: 'Gateway API', nantian: '✅ v1.5.1', envoy: '✅', traefik: '✅', nginx: '✅' },
      { feature: 'Control Plane', nantian: 'Go', envoy: 'Go', traefik: 'Go', nginx: 'Go' },
      { feature: 'Data Plane', nantian: 'Rust 🦀', envoy: 'C++', traefik: 'Go', nginx: 'NGINX C' },
      { feature: 'AI Gateway', nantian: '✅ Experimental', envoy: '✅ (AI Gateway)', traefik: '❌', nginx: '❌' },
      { feature: 'Wasm Plugins', nantian: '✅ Experimental', envoy: '✅', traefik: '✅', nginx: '❌' },
      { feature: 'Helm Chart', nantian: '✅', envoy: '✅', traefik: '✅', nginx: '✅' },
      { feature: 'License', nantian: 'Apache 2.0', envoy: 'Apache 2.0', traefik: 'MIT', nginx: 'Apache 2.0' },
    ],
    summary:
      "Nantian's key differentiator: Rust data plane for memory safety and high concurrency, plus native AI Gateway capabilities to manage LLM provider traffic without extra components.",
    colHeaders: ['Feature', 'Nantian Gateway', 'Envoy Gateway', 'Traefik', 'NGINX Gateway'],
  },
  useCases: {
    heading: 'Use Cases',
    subtitle: 'From Kubernetes Ingress to AI Gateway — one platform for every scenario',
    linkText: '🎯 More Use Cases →',
    linkHref: '/use-cases/',
    cases: [
      {
        icon: '🚪',
        title: 'Kubernetes Ingress',
        desc: 'Standard Gateway API compatible, suitable for NGINX Ingress migration. Supports HTTP, gRPC, TCP, UDP, and TLS routing — no custom CRDs required.',
      },
      {
        icon: '🤖',
        title: 'AI API Gateway',
        desc: 'Built-in AIService and TokenPolicy resources unify authentication, rate limiting, and routing across OpenAI, Anthropic, Hunyuan, and other model providers.',
      },
      {
        icon: '🔌',
        title: 'Wasm Edge Extensions',
        desc: 'Inject custom logic into the data plane via WasmPlugin — request rewriting, authentication, observability — hot-loadable without restarting the gateway.',
      },
      {
        icon: '📊',
        title: 'Multi-Cluster Traffic',
        desc: 'gRPC/xDS protocol distributes routing snapshots. Decoupled control and data planes enable multi-cluster federation with independent scaling.',
      },
    ],
  },
  quickStart: {
    heading: 'Quick Start',
    subtitle: 'Add the Helm repository, install the gateway, then follow the full quick start',
    copyLabel: 'Copy',
    copiedLabel: 'Copied',
  },
  navbar: {
    docs: 'Docs',
    github: 'GitHub',
    switchLang: '中文',
    docsHref: '/concepts/',
    githubHref: 'https://github.com/nantian-gw/gateway',
  },
  footer: {
    docsLabel: 'Docs',
    aboutLabel: 'About',
    contactLabel: 'Contact',
    privacyLabel: 'Privacy',
    termsLabel: 'Terms',
    communityLabel: 'Community',
    builtWith: 'Built with Astro',
    docsHref: '/concepts/',
    aboutHref: '/about/',
    contactHref: '/contact/',
    privacyHref: '/privacy/',
    termsHref: '/terms/',
    footerAria: 'Footer',
    footerLinksAria: 'Footer links',
  },
};

type LandingCopy = typeof en;

const zh: LandingCopy = {
  hero: {
    heading: 'Nantian Gateway — Kubernetes Gateway API 网关',
    subtitle: 'Kubernetes Gateway API 控制面与 Rust 数据面',
    tagline: '标准 Gateway API 路由 · Go 控制面 · gRPC/xDS · 实验性 AI 与 Wasm 扩展',
    quickStartLabel: '快速开始',
    quickStartHref: '/zh/getting-started/quick-start/',
    comparisonHref: '/zh/comparison/',
    faqHref: '/zh/faq/',
    useCasesHref: '/zh/use-cases/',
    comparisonLabel: '功能对比',
    faqLabel: 'FAQ',
    useCasesLabel: '使用场景',
    ariaLabel: '首页横幅',
  },
  homeIntro: {
    sectionTitle: '为什么选择 Nantian Gateway',
    sectionSubtitle: '面向云原生时代的下一代 API 网关，融合 Go 生态与 Rust 性能',
    highlights: [
      {
        title: '分离式平面架构',
        desc: '控制面使用 Go 语言监听 Kubernetes 集群状态，将 Gateway、HTTPRoute、Service 等资源翻译为内部路由模型；数据面采用 Rust 实现，通过 gRPC/xDS 协议接收运行时快照，以零 GC 停顿处理每一条请求。两个平面独立扩缩容，互不干扰。',
      },
      {
        title: 'Gateway API 原生支持',
        desc: '全面实现 Kubernetes Gateway API v1.5.1 规范，声明 54 项一致性特性。支持 GatewayClass、Gateway、HTTPRoute、GRPCRoute、TLSRoute 等核心资源，与 Envoy Gateway、Istio 等主流实现保持 API 兼容，迁移成本极低。',
      },
      {
        title: '极致性能与资源效率',
        desc: 'Rust 数据面无 GC、零成本抽象，单核吞吐可达数万 QPS。内存占用低（~15MB 基线），启动时间毫秒级。内置连接池复用、零拷贝转发、异步 I/O 等优化，在生产环境中经过大规模验证。',
      },
      {
        title: '实验性 AI 网关能力',
        desc: '内置 AIService 和 TokenPolicy 资源，可统一管理多个模型提供方（OpenAI、HuggingFace 等）的 API 端点与认证凭据。支持基于 token 的速率限制与配额管理，为 AI 应用提供统一流量入口，降低多模型集成的运维复杂度。',
      },
      {
        title: '可扩展的 Wasm 插件体系',
        desc: '通过 WasmPlugin 资源支持 URL、ConfigMap 或内联模块三种来源的 Wasm 扩展。插件可绑定到特定 Gateway 或 Route，实现自定义认证、流量染色、请求改写等能力，无需重启网关进程即可热加载。',
      },
      {
        title: '生产级运维能力',
        desc: '提供 Admin API 用于运行时配置查询与调试，内置 Prometheus 指标端点与 Grafana 面板模板，支持健康检查探针与就绪探针。Helm Chart 一键部署，Kustomize Overlay 灵活定制，适配从裸金属到 Kubernetes 的多种部署环境。',
      },
    ],
    bottomCta: {
      title: '开始使用 Nantian Gateway',
      desc: '只需一条 Helm 命令即可在 Kubernetes 集群中部署。支持 Gateway API 标准，兼容现有工具链，5 分钟上手。',
      linkText: '查看快速开始 →',
      linkHref: '/zh/getting-started/quick-start/',
    },
    perfTitle: '性能基准',
    perfItems: [
      '单核吞吐量可达 30,000+ QPS，延迟 P99 低于 5ms',
      '内存占用仅 15MB 起，启动时间 < 50ms',
      '启动时间 < 50ms，支持热重载配置与插件',
      '支持 10,000+ 并发连接，零拷贝转发无性能损耗',
    ],
    communityTitle: '社区与生态',
    communityItems: [
      'Apache 2.0 开源协议，完全免费商用，无任何功能限制',
      '活跃的 GitHub 社区，欢迎贡献代码、文档与使用反馈',
      '与 Envoy Gateway、Istio 等主流实现 API 兼容，迁移成本低',
      '详细的中英文文档，覆盖从入门到生产部署的全流程',
    ],
  },
  features: {
    sectionTitle: '核心特性',
    sectionSubtitle: '一个平台，满足所有网关需求',
    features: [
      {
        icon: '🚪',
        title: 'Gateway API v1.5.1',
        description: '声明支持的特性由 gateway 仓库的支持矩阵和一致性配置生成',
        href: '/zh/api-reference/gateway-api/',
      },
      {
        icon: '🤖',
        title: '实验性 AI 网关',
        description: 'AIService 与 TokenPolicy 默认关闭，开启后用于模型提供方配置和 token 策略',
        href: '/zh/features/ai-gateway/',
      },
      {
        icon: '⚡',
        title: '控制面与数据面分离',
        description: 'Go 控制面监听 Kubernetes 资源，Rust 数据面通过 gRPC/xDS 接收运行时快照',
        href: '/zh/concepts/split-plane/',
      },
      {
        icon: '🔌',
        title: '实验性 Wasm 扩展',
        description: 'WasmPlugin 支持 URL、ConfigMap 或 inline 模块来源，并绑定到目标资源',
        href: '/zh/features/wasm-plugins/',
      },
      {
        icon: '📊',
        title: '运维可见性',
        description: '提供 Admin API、Prometheus 指标、Grafana 面板和健康检查端口',
        href: '/zh/features/security-observability/',
      },
      {
        icon: '🚀',
        title: 'Helm 与 Kustomize',
        description: 'Helm chart 发布在 chart.nantian.dev，仓库也提供 Kustomize overlays',
        href: '/zh/installation/',
      },
    ],
  },
  architecture: {
    sectionTitle: '架构',
    sectionSubtitle: '分离式控制面与数据面，通过 gRPC xDS 协议通信',
    imgAlt: 'Nantian Gateway 架构图',
  },
  codeExample: {
    heading: '5 分钟快速开始',
    subtitle: '一条 Helm 命令安装，一个 HTTPRoute 资源即可路由流量',
    step1Label: '① 安装网关',
    step2Label: '② 创建你的第一个路由',
    docLinkText: '📖 完整文档 →',
    docLinkHref: '/zh/getting-started/quick-start/',
  },
  comparison: {
    heading: '为什么选择 Nantian Gateway？',
    subtitle: '与主流 Gateway API 实现的对比',
    detailLinkText: '🔬 详细对比 →',
    detailLinkHref: '/zh/comparison/',
    rows: [
      { feature: '标准 Gateway API', nantian: '✅ v1.5.1', envoy: '✅', traefik: '✅', nginx: '✅' },
      { feature: '控制面语言', nantian: 'Go', envoy: 'Go', traefik: 'Go', nginx: 'Go' },
      { feature: '数据面语言', nantian: 'Rust 🦀', envoy: 'C++', traefik: 'Go', nginx: 'NGINX C' },
      { feature: 'AI 网关能力', nantian: '✅ 实验', envoy: '✅ (AI Gateway)', traefik: '❌', nginx: '❌' },
      { feature: 'Wasm 插件', nantian: '✅ 实验', envoy: '✅', traefik: '✅', nginx: '❌' },
      { feature: '内置 Helm Chart', nantian: '✅', envoy: '✅', traefik: '✅', nginx: '✅' },
      { feature: '开源协议', nantian: 'Apache 2.0', envoy: 'Apache 2.0', traefik: 'MIT', nginx: 'Apache 2.0' },
    ],
    summary:
      'Nantian 的核心差异：Rust 数据面带来内存安全和高并发性能，原生 AI Gateway 能力让你无需额外组件即可管理 LLM 提供商流量。',
    colHeaders: ['特性', 'Nantian Gateway', 'Envoy Gateway', 'Traefik', 'NGINX Gateway'],
  },
  useCases: {
    heading: '使用场景',
    subtitle: '从 Kubernetes Ingress 到 AI 网关，一个平台覆盖所有需求',
    linkText: '🎯 更多场景 →',
    linkHref: '/zh/use-cases/',
    cases: [
      {
        icon: '🚪',
        title: 'Kubernetes Ingress 入口',
        desc: '标准 Gateway API 兼容，NGINX Ingress 迁移友好。支持 HTTP、gRPC、TCP、UDP、TLS 全协议路由，无需自定义 CRD。',
      },
      {
        icon: '🤖',
        title: 'AI API 网关',
        desc: '内置 AIService 与 TokenPolicy 资源，统一管理 OpenAI、Anthropic、混元等多模型提供商的认证、限流和路由。',
      },
      {
        icon: '🔌',
        title: 'Wasm 边缘扩展',
        desc: '通过 WasmPlugin 在数据面注入自定义逻辑——请求改写、认证、观测——无需重启网关进程即可热加载。',
      },
      {
        icon: '📊',
        title: '多集群流量管理',
        desc: 'gRPC/xDS 协议分发路由快照，控制面与数据面解耦，支持多集群联邦部署与独立扩缩容。',
      },
    ],
  },
  quickStart: {
    heading: '快速开始',
    subtitle: '添加 Helm 仓库，安装网关，然后进入完整快速开始',
    copyLabel: '复制',
    copiedLabel: '已复制',
  },
  navbar: {
    docs: '文档',
    github: 'GitHub',
    switchLang: 'EN',
    docsHref: '/zh/concepts/',
    githubHref: 'https://github.com/nantian-gw/gateway',
  },
  footer: {
    docsLabel: '文档',
    aboutLabel: '关于项目',
    contactLabel: '联系我们',
    privacyLabel: '隐私政策',
    termsLabel: '服务条款',
    communityLabel: '社区',
    builtWith: '基于 Astro 构建',
    docsHref: '/zh/concepts/',
    aboutHref: '/zh/about/',
    contactHref: '/zh/contact/',
    privacyHref: '/zh/privacy/',
    termsHref: '/zh/terms/',
    footerAria: '页脚',
    footerLinksAria: '页脚链接',
  },
};

export const landingCopy: Record<LandingLang, LandingCopy> = { en, zh };
