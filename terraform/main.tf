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


resource "aws_s3_bucket" "csv_storage" {
  bucket = "case-bucket-ounass"

  tags = {
    Name        = "CSV Parser Storage"
    Environment = "dev"
    Terraform   = "true"
  }
}


resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}


resource "aws_s3_bucket_versioning" "csv_storage_versioning" {
  bucket = aws_s3_bucket.csv_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}


resource "aws_s3_bucket_lifecycle_configuration" "csv_storage_lifecycle" {
  bucket = aws_s3_bucket.csv_storage.id

  rule {
    id     = "7-days-to-glacier"
    status = "Enabled"

    filter {
      prefix = ""
    }

    transition {
      days          = 7
      storage_class = "GLACIER"
    }

    expiration {
      days = 365
    }
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "csv_storage_public_access_block" {
  bucket = aws_s3_bucket.csv_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "csv_storage_encryption" {
  bucket = aws_s3_bucket.csv_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

module "eks" {
  source  = "terraform-aws-modules/eks/aws"
  version = "~> 18.0"

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