# Expense Tracker

A full-stack expense tracking application built to demonstrate production-grade cloud infrastructure and DevOps practices on AWS.

> 📖 **[Deployment Guide →](DEPLOYMENT_GUIDE.md)** - step-by-step commands to deploy from scratch.

## Infrastructure Docs

| Module     | README                                                 | Description                            |
| ---------- | ------------------------------------------------------ | -------------------------------------- |
| Terraform  | [infra/terraform/README.md](infra/terraform/README.md) | VPC, EKS, RDS, IAM - all AWS resources |
| Gateway    | [infra/gateway/README.md](infra/gateway/README.md)     | Shared ALB via Kubernetes Gateway API  |
| ArgoCD     | [infra/argocd/README.md](infra/argocd/README.md)       | GitOps controller + app definitions    |
| Kubernetes | [infra/k8s/README.md](infra/k8s/README.md)             | Kustomize base/overlay manifests       |

---

## Infrastructure Overview

```
                        ┌─────────────────────────────────────────┐
                        │              AWS EKS Cluster             │
                        │                                          │
  Internet              │  ┌──────────┐    ┌─────────────────┐    │
     │                  │  │  ArgoCD  │    │   infra ns      │    │
     ▼                  │  │  (GitOps)│    │  Gateway (ALB)  │    │
  ┌─────┐               │  └──────────┘    └────────┬────────┘    │
  │ ALB │               │                           │             │
  └──┬──┘               │         ┌─────────────────┼──────────┐  │
     │                  │         │                 │          │  │
     ├── /client/*  ────┼─────────┼──► client svc   │  prod ns │  │
     ├── /api/*     ────┼─────────┼──► server svc   │          │  │
     │                  │         └───────────────────────────┘  │
     ├── /dev/client/* ─┼─────────┼──► client svc   │  dev ns   │  │
     ├── /dev/api/*  ───┼─────────┼──► server svc   │          │  │
     │                  │         └───────────────────────────┘  │
     └── /argocd/*  ────┼──► ArgoCD UI                           │
                        └─────────────────────────────────────────┘
                                          │
                                          ▼
                                 ┌─────────────────┐
                                 │   AWS RDS        │
                                 │   PostgreSQL 16  │
                                 │  (private subnet)│
                                 └─────────────────┘
```

---

## Tech Stack

| Layer                   | Technology                       |
| ----------------------- | -------------------------------- |
| Cloud                   | AWS (EKS, RDS, ALB, VPC, IAM)    |
| IaC                     | Terraform                        |
| Container Orchestration | Kubernetes (EKS)                 |
| GitOps                  | ArgoCD                           |
| Config Management       | Kustomize (base + overlays)      |
| Ingress                 | AWS Gateway API + ALB Controller |
| CI/CD                   | GitHub Actions                   |
| Container Registry      | Docker Hub                       |
| Backend                 | Node.js + Express                |
| Frontend                | React (CRA)                      |
| Database                | PostgreSQL 16                    |

---

## Key Infrastructure Decisions

**Kustomize overlays** - single base, `dev` and `prod` overlays for environment-specific config (image tags, paths, configmaps). No Helm charts.

**Shared ALB via Gateway API** - one internet-facing ALB handles all traffic. HTTPRoutes in each namespace attach to it using path-based routing (`/client`, `/dev/client`, `/argocd`).

**GitOps with ArgoCD** - all deployments are driven by Git. Pushing to `devops/ci-cd` deploys to dev, pushing to `main` deploys to prod.

**IRSA** - EKS pods access AWS services (ALB controller) via IAM Roles for Service Accounts, no static credentials.

**Secrets outside Git** - Kubernetes secrets are created manually in the cluster, never committed to the repo.

---

## Repository Structure

```
expense-tracker/
├── frontend/                    # React app
├── server/                      # Node.js + Express API
├── infra/
│   ├── terraform/               # VPC, EKS, RDS, IAM, ALB controller (Helm)
│   ├── gateway/                 # GatewayClass, Gateway, LoadBalancerConfig
│   ├── argocd/                  # ArgoCD install + Application CRDs
│   └── k8s/
│       ├── base/                # Deployments, Services, Routes (env-agnostic)
│       └── overlays/
│           ├── dev/             # Dev patches, configmap, namespace
│           └── prod/            # Prod patches, configmap, namespace
└── .github/workflows/main.yaml  # CI - build, push, update image tags
```

---

## CI/CD Pipeline

```
git push (frontend/** or server/**)
    │
    ├── GitHub Actions detects changed files
    ├── Builds Docker image
    ├── Pushes :latest + :<git-sha> to Docker Hub
    └── Updates kustomization.yaml with new image SHA
            │
            └── ArgoCD detects Git change → syncs cluster
```

Branch strategy:

- `devops/ci-cd` → updates `overlays/dev` → ArgoCD deploys to dev namespace
- `main` → updates `overlays/prod` → ArgoCD deploys to prod namespace

---

## API

| Method | Path               | Auth | Description        |
| ------ | ------------------ | ---- | ------------------ |
| POST   | /api/auth/register | No   | Register user      |
| POST   | /api/auth/login    | No   | Login, returns JWT |
| GET    | /api/expenses      | JWT  | List expenses      |
| POST   | /api/expenses      | JWT  | Add expense        |
| DELETE | /api/expenses/:id  | JWT  | Delete expense     |
| GET    | /api/analytics     | JWT  | Spending breakdown |
