output "s3_bucket_name" {
  description = "Name of the S3 bucket for CSV storage"
  value       = aws_s3_bucket.csv_storage.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for CSV storage"
  value       = aws_s3_bucket.csv_storage.arn
}

output "eks_cluster_name" {
  description = "Name of the EKS cluster"
  value       = module.eks.cluster_name
}

output "eks_cluster_endpoint" {
  description = "Endpoint of the EKS cluster"
  value       = module.eks.cluster_endpoint
}

output "vpc_id" {
  description = "ID of the VPC"
  value       = module.vpc.vpc_id
}