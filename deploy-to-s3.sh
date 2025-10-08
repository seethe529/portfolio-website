#!/bin/bash

# AWS S3 Static Website Deployment Script
# Make sure you have AWS CLI installed and configured

# Configuration
BUCKET_NAME="ryan-lingo-portfolio"  # Change this to your preferred bucket name
REGION="us-east-1"  # Change to your preferred region

echo "🚀 Deploying Ryan Lingo Portfolio to S3..."

# Create S3 bucket
echo "📦 Creating S3 bucket: $BUCKET_NAME"
aws s3 mb s3://$BUCKET_NAME --region $REGION

# Enable static website hosting
echo "🌐 Configuring static website hosting..."
aws s3 website s3://$BUCKET_NAME --index-document index.html --error-document index.html

# Upload files
echo "📤 Uploading website files..."
aws s3 sync . s3://$BUCKET_NAME --exclude "*.sh" --exclude ".DS_Store"

# Set public read permissions
echo "🔓 Setting public read permissions..."
aws s3api put-bucket-policy --bucket $BUCKET_NAME --policy '{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
    }
  ]
}'

# Get website URL
WEBSITE_URL="http://$BUCKET_NAME.s3-website-$REGION.amazonaws.com"

echo "✅ Deployment complete!"
echo "🌍 Your website is available at: $WEBSITE_URL"
echo ""
echo "Note: It may take a few minutes for the website to be fully accessible."