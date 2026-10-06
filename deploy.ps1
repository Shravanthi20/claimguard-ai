$ErrorActionPreference = "Stop"
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Getting AWS Account Info..."
$identity = aws sts get-caller-identity | ConvertFrom-Json
$ACCOUNT_ID = $identity.Account
$REGION = "us-east-1"
$REPO_NAME = "claimguard-backend"

Write-Host "Creating ECR Repository..."
try {
    aws ecr create-repository --repository-name $REPO_NAME --region $REGION | Out-Null
} catch {
    Write-Host "Repository might already exist."
}

Write-Host "Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com"

Write-Host "Building Docker Image..."
docker build -t $REPO_NAME ./backend

Write-Host "Tagging and Pushing Image..."
$IMAGE_URI = "$ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/$REPO_NAME`:latest"
docker tag "$REPO_NAME`:latest" $IMAGE_URI
docker push $IMAGE_URI

Write-Host "Successfully pushed $IMAGE_URI"

Write-Host "Creating ECS Cluster..."
aws ecs create-cluster --cluster-name ClaimGuardCluster --region $REGION | Out-Null

Write-Host "Deployment scripts completed. Further configuration (Task Definitions, Cognito, RDS) should be done iteratively."
