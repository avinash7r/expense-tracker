resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name}-igw"
  })
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = merge(local.common_tags, {
    Name = "${local.name}-nat-eip"
  })
}

resource "aws_nat_gateway" "nat_gw" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.pub_1a.id

  tags = merge(local.common_tags, {
    Name = "${local.name}-nat-gw"
  })
}

# Public route table — routes to IGW
resource "aws_route_table" "rt_pub" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-rt-pub"
  })
}

resource "aws_route_table_association" "rta_pub_1a" {
  subnet_id      = aws_subnet.pub_1a.id
  route_table_id = aws_route_table.rt_pub.id
}

resource "aws_route_table_association" "rta_pub_1b" {
  subnet_id      = aws_subnet.pub_1b.id
  route_table_id = aws_route_table.rt_pub.id
}

# Private route table — routes outbound via NAT
resource "aws_route_table" "rt_pvt" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat_gw.id
  }

  tags = merge(local.common_tags, {
    Name = "${local.name}-rt-pvt"
  })
}

resource "aws_route_table_association" "rta_pvt_1a" {
  subnet_id      = aws_subnet.pvt_1a.id
  route_table_id = aws_route_table.rt_pvt.id
}

resource "aws_route_table_association" "rta_pvt_1b" {
  subnet_id      = aws_subnet.pvt_1b.id
  route_table_id = aws_route_table.rt_pvt.id
}

# RDS route table — fully isolated, no default route
resource "aws_route_table" "rt_rds" {
  vpc_id = aws_vpc.main.id

  tags = merge(local.common_tags, {
    Name = "${local.name}-rt-rds"
  })
}

resource "aws_route_table_association" "rta_rds_1a" {
  subnet_id      = aws_subnet.rds_1a.id
  route_table_id = aws_route_table.rt_rds.id
}

resource "aws_route_table_association" "rta_rds_1b" {
  subnet_id      = aws_subnet.rds_1b.id
  route_table_id = aws_route_table.rt_rds.id
}
