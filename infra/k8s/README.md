# Kubernetes Manifests - Kustomize

Application manifests structured with Kustomize base/overlay pattern. One base, environment-specific overlays for dev and prod.

## Structure

```
k8s/
├── base/                        # Shared, env-agnostic manifests
│   ├── kustomization.yaml
│   ├── client-deployment.yaml   # Frontend Deployment + Service
│   ├── server-deployment.yaml   # Backend Deployment + Service
│   ├── client-route.yaml        # HTTPRoute + TGC for frontend
│   └── server-route.yaml        # HTTPRoute + TGC for backend
│
└── overlays/
    ├── dev/                     # Dev environment
    │   ├── kustomization.yaml
    │   ├── namespace.yaml
    │   ├── patch-server.yaml        # Injects envFrom (configmap + secret)
    │   ├── patch-client-route.yaml  # Changes path /client → /dev/client
    │   ├── patch-server-route.yaml  # Changes path /api → /dev/api
    │   └── config/
    │       └── app-config.env       # Dev configmap values
    │
    └── prod/                    # Prod environment
        ├── kustomization.yaml
        ├── namespace.yaml
        ├── patch-server.yaml        # Injects envFrom (configmap + secret)
        └── config/
            └── app-config.env       # Prod configmap values
```

## How Kustomize Works

```
base/ (common)
    +
overlay/ (env-specific patches)
    │
    ▼
kubectl kustomize → final merged YAML → applied to cluster
```

The base defines the shape of each resource. Overlays only describe what's different - image tags, paths, environment config.

## Base Resources

**Deployments** - define the pod spec without any environment-specific values. No `envFrom`, no image tags pinned. Clean and reusable.

**HTTPRoutes** - define routing rules to the shared ALB. Production paths (`/client`, `/api`) are the defaults since prod requires no patching.

**TargetGroupConfigurations** - register services with the ALB target groups using IP mode (required for EKS).

## Overlay: Dev

```yaml
namespace: dev

images:
  - name: avinashrajure/expense-tracker-frontend
    newTag: <git-sha> # pinned by CI on every push

patches:
  - patch-server.yaml # adds envFrom → configmap + secret
  - patch-client-route.yaml # /client → /dev/client + URLRewrite
  - patch-server-route.yaml # /api    → /dev/api   + URLRewrite

configMapGenerator:
  - name: server-config
    envs: [config/app-config.env]
```

## Overlay: Prod

```yaml
namespace: prod

images:
  - name: avinashrajure/expense-tracker-server
    newTag: <git-sha> # pinned by CI on push to main

patches:
  - patch-server.yaml # adds envFrom → configmap + secret
  # no route patches needed - base paths are already prod paths

configMapGenerator:
  - name: server-config
    envs: [config/app-config.env]
```

## Path Routing

```
Dev overlay patches routes to use /dev/* prefix:

  /dev/client/* → URLRewrite strips /dev/client → nginx gets /
  /dev/api/*    → URLRewrite strips /dev/api    → server gets /api/*

Prod uses base paths (no patch needed):

  /client/*     → URLRewrite strips /client     → nginx gets /
  /api/*        → no rewrite                    → server gets /api/*
```

## Secrets

Secrets are **not managed by Kustomize**. They are created manually in each namespace before deploying:

```bash
kubectl create secret generic server-secrets \
  --from-literal=DB_PASSWORD=xxx \
  --from-literal=JWT_SECRET=xxx \
  -n dev
```

`patch-server.yaml` references the secret by name - Kubernetes wires them together at runtime.

## Image Tag Updates

CI/CD (GitHub Actions) updates image tags automatically on every push:

```
push to devops/ci-cd → updates overlays/dev/kustomization.yaml newTag
push to main         → updates overlays/prod/kustomization.yaml newTag
```

ArgoCD detects the Git change and re-syncs the deployment.

## Dry Run

```bash
# Preview final rendered YAML without applying
kubectl kustomize infra/k8s/overlays/dev
kubectl kustomize infra/k8s/overlays/prod
```
