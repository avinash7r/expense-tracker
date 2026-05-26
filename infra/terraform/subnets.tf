# Public subnets — ALB lives here
resource "aws_subnet" "pub_1a" {
  vpc_id                  = aws_vpc.main.id
  availability_zone       = "${var.aws_region}a"
  cidr_block              = "10.0.1.0/24"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                                  = "${local.name}-pub-1a"
    "kubernetes.io/role/elb"              = "1"
    "kubernetes.io/cluster/${local.eks_cluster_name}" = "shared"
  })
}

resource "aws_subnet" "pub_1b" {
  vpc_id                  = aws_vpc.main.id
  availability_zone       = "${var.aws_region}b"
  cidr_block              = "10.0.2.0/24"
  map_public_ip_on_launch = true

  tags = merge(local.common_tags, {
    Name                                  = "${local.name}-pub-1b"
    "kubernetes.io/role/elb"              = "1"
    "kubernetes.io/cluster/${local.eks_cluster_name}" = "shared"
  })
}

# Private subnets — EKS nodes live here
resource "aws_subnet" "pvt_1a" {
  vpc_id            = aws_vpc.main.id
  availability_zone = "${var.aws_region}a"
  cidr_block        = "10.0.3.0/24"

  tags = merge(local.common_tags, {
    Name                                  = "${local.name}-pvt-1a"
    "kubernetes.io/role/internal-elb"     = "1"
    "kubernetes.io/cluster/${local.eks_cluster_name}" = "owned"
  })
}

resource "aws_subnet" "pvt_1b" {
  vpc_id            = aws_vpc.main.id
  availability_zone = "${var.aws_region}b"
  cidr_block        = "10.0.4.0/24"

  tags = merge(local.common_tags, {
    Name                                  = "${local.name}-pvt-1b"
    "kubernetes.io/role/internal-elb"     = "1"
    "kubernetes.io/cluster/${local.eks_cluster_name}" = "owned"
  })
}

# RDS subnets — isolated, no route to internet
resource "aws_subnet" "rds_1a" {
  vpc_id            = aws_vpc.main.id
  availability_zone = "${var.aws_region}a"
  cidr_block        = "10.0.5.0/24"

  tags = merge(local.common_tags, {
    Name = "${local.name}-rds-1a"
  })
}

resource "aws_subnet" "rds_1b" {
  vpc_id            = aws_vpc.main.id
  availability_zone = "${var.aws_region}b"
  cidr_block        = "10.0.6.0/24"

  tags = merge(local.common_tags, {
    Name = "${local.name}-rds-1b"
  })
}
