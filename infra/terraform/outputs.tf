output "vpc_id" {
  description = "VPC ID - used by EKS, RDS modules"
  value       = aws_vpc.main.id
}

output "public_subnet_ids" {
  description = "Public subnet IDs - ALB target"
  value       = [aws_subnet.pub_1a.id, aws_subnet.pub_1b.id]
}

output "private_subnet_ids" {
  description = "Private subnet IDs - EKS node groups"
  value       = [aws_subnet.pvt_1a.id, aws_subnet.pvt_1b.id]
}

output "rds_subnet_ids" {
  description = "RDS subnet IDs - db subnet group"
  value       = [aws_subnet.rds_1a.id, aws_subnet.rds_1b.id]
}

output "sg_alb_id" {
  description = "ALB security group ID"
  value       = aws_security_group.sg_alb.id
}

output "sg_eks_id" {
  description = "EKS nodes security group ID"
  value       = aws_security_group.sg_eks.id
}

output "sg_rds_id" {
  description = "RDS security group ID"
  value       = aws_security_group.sg_rds.id
}

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
}

output "oidc_provider_arn" {
  description = "OIDC provider ARN - used in IRSA trust policies"
  value       = aws_iam_openid_connect_provider.eks.arn
}

output "oidc_url" {
  description = "OIDC provider URL without https:// - used in IRSA condition keys"
  value       = local.oidc_url
}

output "alb_controller_role_arn" {
  description = "ALB controller IAM role ARN - annotate the Helm serviceAccount with this"
  value       = aws_iam_role.alb_controller.arn
}
