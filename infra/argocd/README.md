# ArgoCD - GitOps Controller

Installs ArgoCD on the cluster and defines the Application CRDs that drive GitOps deployments for dev and prod environments.

## Architecture

```
GitHub Repository (source of truth)
        │
        │  watches
        ▼
┌───────────────────────────────────┐
│  ArgoCD (argocd namespace)        │
│                                   │
│  ┌─────────────────────────────┐  │
│  │  Application: dev           │  │
│  │  branch: devops/ci-cd       │  │
│  │  path: overlays/dev         │  │──► syncs to dev namespace
│  └─────────────────────────────┘  │
│                                   │
│  ┌─────────────────────────────┐  │
│  │  Application: prod          │  │
│  │  branch: main               │  │
│  │  path: overlays/prod        │  │──► syncs to prod namespace
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
        │
        │  accessible via
        ▼
  http://<ALB>/argocd/
```

## Resources

| File                    | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `kustomization.yaml`    | Bundles all resources - installs ArgoCD + registers apps     |
| `namespace.yaml`        | Creates `argocd` namespace                                   |
| `application-dev.yaml`  | ArgoCD Application CRD - watches `devops/ci-cd` branch       |
| `application-prod.yaml` | ArgoCD Application CRD - watches `main` branch               |
| `argocd-route.yaml`     | HTTPRoute - exposes ArgoCD UI at `/argocd` on shared ALB     |
| `argocd-tgc.yaml`       | TargetGroupConfiguration - registers ArgoCD service with ALB |
| `argocd-insecure.yaml`  | ConfigMap patch - disables HTTPS redirect + sets root path   |

## App of Apps Pattern

The `kustomization.yaml` installs ArgoCD AND registers both Application CRDs in one command. ArgoCD bootstraps itself:

```
kubectl apply --server-side -k infra/argocd
       │
       ├── Installs ArgoCD from upstream manifests
       ├── Creates Application: expense-tracker-dev
       └── Creates Application: expense-tracker-prod
                │
                └── ArgoCD picks them up and starts syncing ✅
```

## Sync Policy

Both apps use automated sync:

```yaml
syncPolicy:
  automated:
    prune: true # deletes resources removed from Git
    selfHeal: true # reverts manual cluster changes
  syncOptions:
    - CreateNamespace=true # auto-creates dev/prod namespaces
```

## Branch Strategy

```
devops/ci-cd ──► expense-tracker-dev  ──► dev namespace
main         ──► expense-tracker-prod ──► prod namespace
```

Merging `devops/ci-cd` → `main` promotes dev to prod.

## ArgoCD Config Patches

`argocd-insecure.yaml` patches `argocd-cmd-params-cm`:

```yaml
server.insecure: "true" # disables HTTPS redirect (TLS handled by ALB)
server.rootpath: "/argocd" # serves UI at /argocd path
```

## Deployment

```bash
kubectl apply --server-side -k infra/argocd

# Get admin password
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d
```

UI: `http://<ALB>/argocd/`
