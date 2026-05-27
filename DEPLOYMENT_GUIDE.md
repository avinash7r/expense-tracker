# Deployment Guide

Step-by-step commands to deploy the Expense Tracker on AWS from scratch.

## Prerequisites

- `terraform` CLI
- `kubectl` + `kubectx`
- `aws` CLI (configured with credentials)
- AWS account with sufficient permissions

---

## Step 1 - Provision Infrastructure (Terraform)

```bash
cd infra/terraform

terraform init
terraform apply -var="db_password=<your-db-password>"
```

Creates: VPC, EKS cluster, RDS PostgreSQL, IAM roles, ALB controller, security groups.

---

## Step 2 - Connect to the Cluster

```bash
aws eks update-kubeconfig --name expense-tracker-eks-cluster --region us-east-1

# Verify nodes are ready
kubectl get nodes
```

---

## Step 3 - Install Gateway (Shared ALB)

```bash
kubectl apply -k infra/gateway
```

Wait for the ALB to be provisioned:

```bash
kubectl get gateway -n infra -w
# Wait until PROGRAMMED = True and ADDRESS is populated
```

---

## Step 4 - Get the ALB URL

```bash
kubectl get gateway -n infra
# Copy the ADDRESS value
```

Example: `k8s-infra-sharedal-xxxxxxxxxx.us-east-1.elb.amazonaws.com`

---

## Step 5 - Update Config Files

Get RDS endpoint (strip the `:5432` suffix from the output):

```bash
cd infra/terraform && terraform output rds_endpoint
```

Update `infra/k8s/overlays/dev/config/app-config.env`:

```
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=expensetrackerdb
DB_SSL=true
PORT=3001
DB_USER=avi
FRONTEND_URL=http://<ALB>/dev/client
REACT_APP_API_URL=http://<ALB>/dev
```

Update `infra/k8s/overlays/prod/config/app-config.env`:

```
DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=expensetrackerdb
DB_SSL=true
PORT=3001
DB_USER=avi
FRONTEND_URL=http://<ALB>/client
REACT_APP_API_URL=http://<ALB>
```

Commit and push changes.

---

## Step 6 - Install ArgoCD + App Definitions

```bash
kubectl apply --server-side -k infra/argocd
```

Wait for ArgoCD to be ready:

```bash
kubectl get pods -n argocd -w
# Wait until all pods show Running
```

---

## Step 7 - Create Secrets

Secrets are not stored in Git - create them manually in each namespace:

```bash
# Dev
kubectl create secret generic server-secrets \
  --from-literal=DB_PASSWORD=<your-db-password> \
  --from-literal=JWT_SECRET=<your-jwt-secret> \
  -n dev

# Prod
kubectl create secret generic server-secrets \
  --from-literal=DB_PASSWORD=<your-db-password> \
  --from-literal=JWT_SECRET=<your-jwt-secret> \
  -n prod
```

> ⚠️ `DB_PASSWORD` must match the password used in `terraform apply`.

---

## Step 8 - Verify

```bash
# Check ArgoCD apps are Synced + Healthy
kubectl get application -n argocd

# Check pods are Running in each namespace
kubectl get pods -n dev
kubectl get pods -n prod
```

---

## URLs

| Service       | URL                        |
| ------------- | -------------------------- |
| ArgoCD UI     | `http://<ALB>/argocd/`     |
| Dev Frontend  | `http://<ALB>/dev/client/` |
| Prod Frontend | `http://<ALB>/client/`     |
| Dev API       | `http://<ALB>/dev/api`     |
| Prod API      | `http://<ALB>/api`         |

### ArgoCD Credentials

```bash
kubectl get secret argocd-initial-admin-secret -n argocd \
  -o jsonpath="{.data.password}" | base64 -d
```

Username: `admin`

---

## CI/CD Flow

```
Push to devops/ci-cd → builds image → updates dev overlay tag → ArgoCD syncs dev
Push to main         → builds image → updates prod overlay tag → ArgoCD syncs prod
```

GitHub Actions secrets required: `DOCKER_USERNAME`, `DOCKER_TOKEN`, `ALB_URL`

---

## Teardown

```bash
# Remove k8s resources
kubectl delete -k infra/argocd
kubectl delete -k infra/gateway

# Destroy AWS infrastructure
cd infra/terraform
terraform destroy -var="db_password=<your-db-password>"
```
