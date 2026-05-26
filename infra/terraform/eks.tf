resource "aws_eks_cluster" "main" {
  name     = local.eks_cluster_name
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.35"
  vpc_config {
    subnet_ids = [
      aws_subnet.pub_1a.id,
      aws_subnet.pub_1b.id,
      aws_subnet.pvt_1a.id,
      aws_subnet.pvt_1b.id
    ]
    security_group_ids      = [aws_security_group.sg_eks.id]
    endpoint_private_access = true
    # change to false later to test private access only
    endpoint_public_access = true
  }
  depends_on = [aws_iam_role_policy_attachment.eks_cluster_policy, ]
}

resource "aws_eks_node_group" "main" {
  cluster_name    = aws_eks_cluster.main.name
  node_group_name = "${local.name}-eks-node-group"
  node_role_arn   = aws_iam_role.eks_node_role.arn

  subnet_ids = [
    aws_subnet.pvt_1a.id,
    aws_subnet.pvt_1b.id
  ]

  scaling_config {
    desired_size = 2
    max_size     = 4
    min_size     = 1
  }

  instance_types = ["t3.small"]

  depends_on = [
    aws_iam_role_policy_attachment.eks_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy
  ]
}
