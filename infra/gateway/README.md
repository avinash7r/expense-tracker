# Gateway - Shared AWS ALB

Provisions the cluster-level Gateway API resources that create a single internet-facing ALB shared across all namespaces and applications.

> 📖 See [GATEWAY_API_EXPLAINED.md](GATEWAY_API_EXPLAINED.md) for a deep-dive on how Gateway API works.

## Architecture

```
Internet
    │
    ▼
┌─────────────────────────────────────────┐
│  AWS ALB (internet-facing)              │
│  k8s-infra-sharedal-xxx.us-east-1...   │
│                                         │
│  Listener: HTTP :80                     │
│  Default action: 404                    │
└────────────────┬────────────────────────┘
                 │  Routes attached by namespace owners
                 │
    ┌────────────┼────────────┐──────────────┐
    │            │            │              │
/argocd/*   /client/*   /dev/client/*   /api/*  ...
    │            │            │              │
 argocd ns   prod ns     dev ns         prod ns
```

## Resources

| File                       | Kind                        | Description                                                            |
| -------------------------- | --------------------------- | ---------------------------------------------------------------------- |
| `gatewayclass.yaml`        | `GatewayClass`              | Cluster-wide template - tells Kubernetes to use the AWS ALB controller |
| `gateway.yaml`             | `Gateway`                   | Creates the actual ALB - accepts routes from all namespaces            |
| `loadbalancer-config.yaml` | `LoadBalancerConfiguration` | ALB settings - internet-facing, IPv4                                   |

## Key Concepts

**GatewayClass** - cluster-scoped, owned by cluster admin. Defines which controller provisions the ALB:

```yaml
controllerName: gateway.k8s.aws/alb
```

**Gateway** - creates one ALB. `allowedRoutes.namespaces.from: All` means any namespace can attach HTTPRoutes to this ALB:

```yaml
listeners:
  - name: http
    port: 80
    allowedRoutes:
      namespaces:
        from: All
```

**LoadBalancerConfiguration** - ALB-level settings (scheme, IP type). Referenced by the GatewayClass.

## Separation of Concerns

```
Cluster Admin (this folder)     App Teams (infra/k8s, infra/argocd)
──────────────────────────      ───────────────────────────────────
GatewayClass                    HTTPRoute
Gateway (ALB)                   TargetGroupConfiguration
LoadBalancerConfiguration
```

App teams attach their routes to the shared ALB without needing to know how it was provisioned.

## Namespace

All resources live in the `infra` namespace - separate from application namespaces (`dev`, `prod`, `argocd`).

## Deployment

```bash
kubectl apply -k infra/gateway

# Wait for ALB to be provisioned
kubectl get gateway -n infra -w
```
