# AWS Cloud Notes Project

This is a full-stack project built with React, Node.js, and AWS DynamoDB to showcase skills for your interview.

## Architecture

- **Frontend**: React (Vite + TailwindCSS)
- **Backend**: Node.js (Express)
- **Database**: AWS DynamoDB

## Local Setup

### Prerequisites

1. Node.js installed.
2. AWS CLI installed and configured.

### 1. AWS Configuration

If you have the AWS CLI installed, run:
```bash
aws configure
```
Provide your Access Key, Secret Key, and Default Region (e.g., `us-east-1`).

If you don't have the AWS CLI, you can uncomment the access key variables in `backend/.env` and paste your keys directly (ensure you do not commit these to a public GitHub repo).

### 2. DynamoDB Table Setup

You need to create a DynamoDB table named `CloudNotes` in your AWS account. 
- **Table Name**: `CloudNotes`
- **Partition Key**: `id` (Type: String)

You can create it via the AWS Console or using the AWS CLI:
```bash
aws dynamodb create-table \
    --table-name CloudNotes \
    --attribute-definitions AttributeName=id,AttributeType=S \
    --key-schema AttributeName=id,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST
```

### 3. Running the Backend

```bash
cd backend
npm install
npm run dev
```
The server will start on `http://localhost:5001`.

### 4. Running the Frontend

```bash
cd frontend
npm install
npm run dev
```
The app will open in your browser (usually `http://localhost:5173`).

## Deployment

Since you mentioned you will handle deployment, here are the general steps:

1. **Backend**: You can deploy the Express server to **AWS App Runner** or **AWS Elastic Beanstalk**. Set the environment variables (`DYNAMODB_TABLE_NAME`, `AWS_REGION`, and optionally keys if not using IAM Roles).
2. **Frontend**: Build the React app (`npm run build`). Upload the `dist` folder to an **AWS S3** bucket configured for Static Website Hosting. You can also place **AWS CloudFront** in front of S3 for better performance. Remember to update the `API_URL` in your frontend code to point to your deployed backend.
