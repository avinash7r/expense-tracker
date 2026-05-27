# Terraform - AWS Infrastructure

Provisions all AWS infrastructure required to run the Expense Tracker on EKS.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    AWS (us-east-1)                       │
│                                                          │
│  ┌─────────────────── VPC (10.0.0.0/16) ──────────────┐ │
│  │                                                      │ │
│  │  ┌──────────────┐        ┌──────────────┐           │ │
│  │  │  Public       │        │  Public       │           │ │
│  │  │  Subnet 1a    │        │  Subnet 1b    │           │ │
│  │  │  (ALB)        │        │  (ALB)        │           │ │
│  │  └──────┬───────┘        └──────┬───────┘           │ │
│  │         │                       │                    │ │
│  │  ┌──────▼───────┐        ┌──────▼───────┐           │ │
│  │  │  Private      │        │  Private      │           │ │
│  │  │  Subnet 1a    │        │  Subnet 1b    │           │ │
│  │  │  (EKS Nodes)  │        │  (EKS Nodes)  │           │ │
│  │  └──────┬───────┘        └──────┬───────┘           │ │
│  │         │                       │                    │ │
│  │  ┌──────▼───────┐        ┌──────▼───────┐           │ │
│  │  │  RDS Subnet   │        │  RDS Subnet   │           │ │
│  │  │  1a           │        │  1b           │           │ │
│  │  │  (Postgres)   │        │  (Postgres)   │           │ │
│  │  └──────────────┘        └──────────────┘           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  EKS Cluster (v1.35)                               │  │
│  │  Node Group: 2x t3.small (private subnets)         │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │  RDS PostgreSQL 16 (db.t3.micro, private subnets)  │  │
│  └────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Resources

| File                 | What it creates                                       |
| -------------------- | ----------------------------------------------------- |
| `vpc.tf`             | VPC, DNS settings                                     |
| `subnets.tf`         | 6 subnets - public (ALB), private (EKS), RDS          |
| `routing.tf`         | IGW, NAT Gateway, route tables                        |
| `security_groups.tf` | SGs for ALB, EKS nodes, RDS                           |
| `eks.tf`             | EKS cluster + managed node group                      |
| `rds.tf`             | RDS PostgreSQL instance + subnet group                |
| `roles.tf`           | IAM roles for EKS cluster, node group, ALB controller |
| `oidc.tf`            | OIDC provider for IRSA                                |
| `data.tf`            | Data sources (AMI, caller identity)                   |
| `locals.tf`          | Shared naming + tagging                               |
| `variables.tf`       | Input variables                                       |
| `outputs.tf`         | RDS endpoint, subnet IDs, OIDC ARN, IAM role ARNs     |
| `versions.tf`        | Provider versions                                     |

## Network Design

```
Internet
    │
    ▼
Internet Gateway
    │
    ▼
Public Subnets (1a, 1b)  ← ALB lives here
    │
    ▼ (via NAT Gateway)
Private Subnets (1a, 1b) ← EKS nodes live here
    │
    ▼ (no route out)
RDS Subnets (1a, 1b)     ← Postgres, fully isolated
```

EKS nodes are in private subnets - they can reach the internet via NAT (to pull images) but are not directly reachable from the internet.

RDS has no route to the internet - accessible only from EKS node security group.

## IAM / IRSA

IRSA (IAM Roles for Service Accounts) is used instead of static credentials:

```
EKS Pod → ServiceAccount → IAM Role → AWS API
```

- `alb_controller` role - allows ALB controller pods to create/manage ALBs
- Trust policy scoped to the specific ServiceAccount via OIDC condition

## Variables

| Variable       | Default           | Description                               |
| -------------- | ----------------- | ----------------------------------------- |
| `aws_region`   | `us-east-1`       | Deployment region                         |
| `cluster_name` | `expense-tracker` | Prefix for all resource names             |
| `vpc_cidr`     | `10.0.0.0/16`     | VPC CIDR block                            |
| `db_password`  | -                 | RDS master password (required, sensitive) |

## Usage

```bash
terraform init
terraform apply -var="db_password=<your-password>"
```

## Outputs

```bash
terraform output rds_endpoint       # RDS hostname:port
terraform output oidc_provider_arn  # For IRSA trust policies
terraform output alb_controller_role_arn
```
