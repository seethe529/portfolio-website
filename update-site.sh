#!/bin/bash

# Quick update script for existing S3 website
BUCKET_NAME="ryan-lingo-portfolio"

echo "🔄 Updating website files..."

# Sync only changed files
aws s3 sync . s3://$BUCKET_NAME --exclude "*.sh" --exclude ".DS_Store" --delete

echo "✅ Website updated!"
echo "🌍 Changes will be live shortly at your CloudFront URL"