# CSV Parser Web Application

A cloud-native CSV parsing web application built with Node.js, deployed on AWS EKS with automated CI/CD pipeline.

## 🚀 Quick Start

### Prerequisites
- AWS CLI configured with appropriate credentials
- Terraform installed
- kubectl and Helm installed

### 1. Infrastructure Setup
```bash
# Initialize and deploy EKS cluster with OpenVPN
terraform init
terraform plan
terraform apply
```

### 2. Configure Cluster Access
Add your AWS user to the cluster's aws-auth ConfigMap:
```yaml
mapUsers: |
  - userarn: arn:aws:iam::YOUR-ACCOUNT:user/YOUR-USERNAME
    username: YOUR-USERNAME
    groups:
      - system:masters
```

### 3. Deploy Application
The GitHub Actions workflow (`action.yaml`) automatically:
- Builds Docker image from `csv-web-app/`
- Pushes to Amazon ECR
- Deploys to EKS using Helm charts

## 🏗️ Architecture
- **Frontend**: HTML upload interface
- **Backend**: Node.js Express with CSV parser
- **Infrastructure**: AWS EKS with Nginx sidecar
- **Storage**: S3 with lifecycle policies
- **CI/CD**: GitHub Actions → ECR → EKS

## 📁 Project Structure
```
csv-parse-repo/
├── csv-web-app/          # Node.js application
├── csv-web-helm/         # Kubernetes Helm charts
├── terraform/            # Infrastructure as Code
└── .github/workflows/    # CI/CD pipeline
```

## 🔧 Configuration
- **Region**: eu-central-1
- **Cluster**: EKS with 2 on-demand + 1 spot node
- **Storage**: S3 bucket with intelligent tiering
- **Security**: OpenVPN access + IAM roles

## 📖 Documentation
For detailed setup instructions and architecture overview, see the complete documentation in the project repository.