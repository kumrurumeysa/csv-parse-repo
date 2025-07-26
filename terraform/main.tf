provider "aws" {
  region = "eu-central-1"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.0"

  name = "csv-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["eu-central-1a", "eu-central-1b"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Terraform = "true"
    Environment = "dev"
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "19.21.0"

  cluster_name    = "csv-case-cluster"
  cluster_version = "1.29"
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnets

  enable_irsa = true

  eks_managed_node_groups = {
    spot_nodes = {
      desired_size   = 1
      max_size       = 4
      min_size       = 0
      instance_types = ["t3.medium"]
      capacity_type  = "SPOT"
    }

    ondemand_nodes = {
      desired_size   = 2
      max_size       = 3
      min_size       = 1
      instance_types = ["t3.medium"]
      capacity_type  = "ON_DEMAND"
    }
  }

  tags = {
    "k8s.io/cluster-autoscaler/enabled"                = "true"
    "k8s.io/cluster-autoscaler/csv-case-cluster"       = "owned"
  }
}

resource "aws_security_group_rule" "allow_vpn_to_nodes" {
  type              = "ingress"
  from_port         = 443
  to_port           = 443
  protocol          = "tcp"
  security_group_id = module.eks.node_security_group_id
  cidr_blocks       = ["10.0.0.0/16"]
}