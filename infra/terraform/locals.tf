locals {
  name             = var.cluster_name
  eks_cluster_name = "${var.cluster_name}-eks-cluster"

  common_tags = {
    Project   = var.cluster_name
    ManagedBy = "terraform"
  }

  oidc_url = replace(
    aws_eks_cluster.main.identity[0].oidc[0].issuer,
    "https://", ""
  )
}
