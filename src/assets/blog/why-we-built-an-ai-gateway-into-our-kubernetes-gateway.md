---
title: "Why We Built an AI Gateway Into Our Kubernetes Gateway API Implementation"
description: "Most teams deploying LLM features end up running two proxies — a Kubernetes gateway and a separate AI proxy. We built Nantian Gateway to eliminate that hop."
---

If you're running LLM features in production, you've probably encountered this architecture:

```
Internet → Kubernetes Gateway (Istio/Contour/NGINX) → AI Proxy (LiteLLM/Portkey) → OpenAI/Anthropic/etc.
                                  ↓
                         Your microservices
```

That's two separate proxies to deploy, secure, monitor, and tune. The AI proxy adds latency (an extra network hop), duplicates operational surface (another set of alerts, another dashboard, another config language), and introduces a second point of failure.

We built [Nantian Gateway](https://github.com/nantian-gw/gateway) to collapse this into one:

```
Internet → Nantian Gateway → OpenAI/Anthropic/etc.
                                  ↓
                         Your microservices
```

One proxy. One set of metrics. One config language (Gateway API). Same binary handles both your regular HTTP traffic and your LLM provider routing.

## The Problem With Two Proxies

The standalone AI proxy approach (LiteLLM, Portkey, AI Gateway, etc.) works, but it comes with costs that compound as you scale:

**Operational surface doubles.** Every proxy means another Deployment to size, another Service to wire, another set of NetworkPolicies to maintain, another pair of `/readyz` endpoints to monitor. You need alerting for both, dashboards for both, and upgrade cycles for both.

**Latency.** The extra hop between your ingress gateway and the AI proxy adds 1-5ms even in the best case (same cluster). If they're in different namespaces with network policies enforcing isolation, you're adding connection setup time on top.

**Observability fragmentation.** Your gateway emits metrics in one format, your AI proxy in another. Correlating "this user's request came through the gateway fine but failed at the AI proxy" requires cross-referencing two monitoring stacks.

**Auth surface area.** Two proxies means two auth configurations. The gateway authenticates incoming requests; the AI proxy authenticates to upstream providers. If either is misconfigured, you leak credentials or drop valid traffic.

## What It Looks Like

With Nantian Gateway, you configure AI routing using the same Gateway API resources you already use for HTTP routing. Here's a complete example — deploy an AI service that routes to OpenAI with rate limiting:

```yaml
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: ai-gateway
spec:
  gatewayClassName: nantian-gw
  listeners:
  - name: https
    port: 443
    protocol: HTTPS
---
apiVersion: gateway.nantian.dev/v1alpha1
kind: AIService
metadata:
  name: openai-router
spec:
  models:
  - name: gpt-4o
    provider:
      name: openai
      apiKeySecretRef:
        name: openai-key
        key: api-key
  - name: claude-3.5
    provider:
      name: anthropic
      apiKeySecretRef:
        name: anthropic-key
        key: api-key
  rateLimit:
    tokensPerMinute: 100000
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: ai-route
spec:
  parentRefs:
  - name: ai-gateway
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/chat
    backendRefs:
    - name: openai-router
      group: gateway.nantian.dev
      kind: AIService
```

That's it. The same Gateway that routes your microservices traffic now also handles LLM provider routing, with built-in rate limiting, token counting, and failover.

## What's Included

The AI gateway module in the data plane covers the features most teams need when deploying LLMs:

| Feature | What It Does |
|---------|-------------|
| **Model routing** | Route to different providers (OpenAI, Anthropic, Ollama, etc.) based on model name |
| **Semantic cache** | Cache LLM responses by embedding similarity — reduces cost for repeated queries |
| **Prompt guard** | Block injection attempts before they reach the provider |
| **Content safety** | Filter responses for harmful content at the proxy layer |
| **PII masking** | Strip or redact sensitive information (emails, SSNs, API keys) from requests/responses |
| **A/B testing** | Route a percentage of traffic to a different model or provider |
| **Fallback** | Retry with a different provider when the primary returns an error |
| **Cost tracking** | Per-model, per-user token accounting with Prometheus metrics |
| **Token policies** | Rate limit by token count, request count, or concurrent requests |
| **Langfuse integration** | Export traces to Langfuse for observability and debugging |

All of these run in the same data plane process that handles your HTTP traffic. No sidecar, no separate deployment, no extra hop.

## Performance

Because the AI gateway runs in the same process as the HTTP proxy, the overhead is minimal. Our nightly benchmarks (600s vegeta, 100 concurrent connections) show:

| Metric | Without AI gateway | With AI gateway (routing + token counting) |
|--------|-------------------|-------------------------------------------|
| RPS | ~10,500 | ~10,200 |
| P50 latency | 3.2ms | 3.5ms |
| P99 latency | 12ms | 14ms |
| Memory | ~102 MiB | ~108 MiB |

The difference is within measurement noise for most workloads. The AI gateway features are implemented as filter stages in the proxy pipeline — they only execute when the request matches an AI service route, so regular HTTP traffic sees zero overhead.

## When Not to Use This

If you already have a mature AI proxy deployment (LiteLLM handling thousands of models, custom provider integrations, etc.), migrating to a combined gateway might not be worth the disruption. The standalone AI proxy ecosystem is more mature and has broader provider support.

If you don't need Kubernetes Gateway API features at all — your stack is serverless, or you're using a different ingress model — then a lightweight AI proxy makes more sense.

But if you're running Kubernetes, need a Gateway API implementation, and are deploying LLM features, the combined approach eliminates an entire category of operational complexity. No second proxy to deploy. No second set of dashboards to maintain. No second point of failure to debug at 2 AM.

## Try It

```bash
helm repo add nantian-gw https://chart.nantian.dev
helm install nantian-gw nantian-gw/nantian-gw --namespace nantian-gw --create-namespace
```

Documentation: [https://nantian.dev](https://nantian.dev)
GitHub: [github.com/nantian-gw/gateway](https://github.com/nantian-gw/gateway)