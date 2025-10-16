# Ryan Lingo Portfolio Website - Technical Architecture Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Frontend Architecture](#frontend-architecture)
4. [Backend & APIs](#backend--apis)
5. [Data Flow](#data-flow)
6. [Security Review](#security-review)
7. [Monitoring & Logging](#monitoring--logging)
8. [Version Control & Deployment](#version-control--deployment)
9. [Cost & Performance](#cost--performance)
10. [Backup & Recovery](#backup--recovery)
11. [Future Expansion](#future-expansion)
12. [Security Checklist](#security-checklist)
13. [Glossary](#glossary)

---

## Overview

### Purpose
The Ryan Lingo Portfolio Website is a professional showcase featuring:
- Personal portfolio and resume
- Technical blog with dynamic content management
- Interactive 3D orbital visualization using CesiumJS
- Contact form with AWS serverless backend
- Responsive design optimized for all devices

### Major Components
- **Static Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Blog System**: Dynamic JSON-based content management
- **3D Visualization**: CesiumJS with custom orbital tract data
- **Contact System**: AWS Lambda + API Gateway + DynamoDB + SES
- **Hosting**: AWS Amplify with CloudFront CDN
- **Version Control**: Git with GitHub integration

### Technology Stack
```
Frontend:     HTML5, CSS3, JavaScript ES6+, CesiumJS 1.109
Backend:      AWS Lambda (Node.js), API Gateway, DynamoDB
Storage:      AWS S3, DynamoDB
CDN:          AWS CloudFront (via Amplify)
Deployment:   AWS Amplify
Monitoring:   AWS CloudWatch
Email:        AWS SES
```

---

## Architecture Diagram

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   GitHub Repo   │───▶│   AWS Amplify    │───▶│   CloudFront    │
│                 │    │   Build & Deploy │    │      CDN        │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   User Browser  │◀───│   Static Assets  │◀───│   S3 Bucket     │
│                 │    │   HTML/CSS/JS    │    │   (via Amplify) │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │
         │ Contact Form Submission
         ▼
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│  API Gateway    │───▶│  Lambda Function │───▶│   DynamoDB      │
│  REST Endpoint  │    │  Contact Handler │    │   Messages      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Amazon SES    │
                       │  Email Service  │
                       └─────────────────┘
```

---

## Frontend Architecture

### Framework & Libraries
- **Core**: Vanilla HTML5, CSS3, JavaScript ES6+
- **3D Visualization**: CesiumJS 1.109 (self-hosted)
- **Styling**: Custom CSS with CSS Grid, Flexbox, and CSS Variables
- **Fonts**: Google Fonts (Inter family)
- **Icons**: Inline SVG icons

### File Structure
```
/
├── index.html                 # Main landing page
├── manifest.json             # PWA manifest
├── robots.txt               # SEO crawler instructions
├── sitemap.xml              # SEO sitemap
├── assets/
│   ├── css/
│   │   ├── styles.css       # Main stylesheet
│   │   └── orbital-controls.css # Cesium UI customizations
│   ├── scripts/
│   │   ├── contact-form.js  # Contact form handler
│   │   ├── blog.js          # Blog content loader
│   │   └── orbital-viz-simple.js # 3D visualization
│   ├── images/              # Optimized images
│   ├── documents/           # PDF downloads
│   └── data/                # CZML orbital data files
├── blog/
│   ├── index.html           # Blog listing page
│   ├── posts.json           # Blog metadata
│   └── posts/               # Individual blog posts
├── cesium/                  # Self-hosted CesiumJS library
└── docs/                    # Technical documentation
```

### Routing Structure
- **Static Routes**: Direct file serving via Amplify
- **Blog Routes**: `/blog/` → blog index, `/blog/posts/{slug}.html` → individual posts
- **Asset Routes**: `/assets/*` → static assets with caching headers
- **API Routes**: External API Gateway endpoint for contact form

### Asset Pipeline
- **Images**: Manually optimized JPEG/PNG files
- **CSS**: Single concatenated file with CSS Grid/Flexbox
- **JavaScript**: Modular ES6+ files loaded as needed
- **Fonts**: Google Fonts with preconnect optimization
- **CZML Data**: Custom orbital visualization data files

### Configuration Management
- **Environment Variables**: None required for frontend
- **Build Configuration**: `amplify.yml` defines build process
- **Custom Headers**: CZML files served with `application/json` content-type

---

## Backend & APIs

### AWS Services Architecture

#### 1. AWS Lambda Function
- **Function Name**: `portfolio-contact-handler`
- **Runtime**: Node.js 18.x
- **Region**: us-east-1
- **Memory**: 128 MB
- **Timeout**: 30 seconds
- **Trigger**: API Gateway REST API

**Function Code Structure**:
```javascript
exports.handler = async (event) => {
    // Input validation and sanitization
    // Rate limiting check
    // DynamoDB write operation
    // SES email sending
    // Response formatting
};
```

**Environment Variables**:
- `DYNAMODB_TABLE_NAME`: portfolio-contact-messages
- `SES_FROM_EMAIL`: [configured email address]
- `SES_TO_EMAIL`: [recipient email address]

#### 2. Amazon API Gateway
- **API Type**: REST API
- **Endpoint**: `https://lpgzsfaxr3.execute-api.us-east-1.amazonaws.com/prod`
- **Method**: POST /
- **CORS**: Enabled for website domain
- **Rate Limiting**: 1000 requests per day per IP
- **Authentication**: None (public endpoint)

**Request/Response Format**:
```json
// Request
{
    "name": "string (max 100 chars)",
    "email": "string (max 100 chars)", 
    "subject": "string (max 200 chars)",
    "message": "string (max 1000 chars)"
}

// Response
{
    "success": true,
    "messageId": "uuid",
    "timestamp": "ISO 8601 string"
}
```

#### 3. DynamoDB Table
- **Table Name**: `portfolio-contact-messages`
- **Partition Key**: `messageId` (String)
- **Sort Key**: `timestamp` (String)
- **Billing Mode**: On-demand
- **Encryption**: AWS managed keys

**Item Structure**:
```json
{
    "messageId": "uuid-v4",
    "timestamp": "2024-10-16T10:30:00.000Z",
    "name": "Contact Name",
    "email": "contact@example.com",
    "subject": "Message Subject",
    "message": "Message content",
    "ipAddress": "xxx.xxx.xxx.xxx",
    "userAgent": "Browser/Version"
}
```

#### 4. Amazon SES (Simple Email Service)
- **Region**: us-east-1
- **Configuration**: Production access (out of sandbox)
- **Verified Domains**: [your domain]
- **Sending Limits**: 200 emails/day, 1 email/second
- **Bounce/Complaint Handling**: CloudWatch monitoring

### IAM Roles and Permissions

#### Lambda Execution Role: `portfolio-contact-lambda-role`
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream", 
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:us-east-1:*:*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem"
            ],
            "Resource": "arn:aws:dynamodb:us-east-1:*:table/portfolio-contact-messages"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ses:SendEmail",
                "ses:SendRawEmail"
            ],
            "Resource": "*"
        }
    ]
}
```

### Error Handling
- **Input Validation**: Field length limits, email format validation
- **Rate Limiting**: Client-side (1 minute) and server-side (API Gateway)
- **Database Errors**: Graceful fallback with user notification
- **Email Errors**: Logged to CloudWatch, user receives generic success message
- **Network Errors**: Client-side retry logic with exponential backoff

---

## Data Flow

### Contact Form Submission Process

1. **User Interaction**
   - User fills out contact form on website
   - Client-side validation (required fields, email format)
   - Rate limiting check (1 minute between submissions)

2. **Form Submission**
   - JavaScript prevents default form submission
   - Data sanitization and field length truncation
   - HTTPS POST request to API Gateway endpoint

3. **API Gateway Processing**
   - Request validation and CORS headers
   - Rate limiting enforcement (1000/day per IP)
   - Forward to Lambda function

4. **Lambda Function Execution**
   - Parse and validate JSON payload
   - Generate unique message ID (UUID v4)
   - Extract client IP and User-Agent

5. **DynamoDB Storage**
   - Write message data to `portfolio-contact-messages` table
   - Include metadata (timestamp, IP, user agent)
   - Handle write errors gracefully

6. **Email Notification**
   - Format email with message details
   - Send via Amazon SES to configured recipient
   - Log email sending status

7. **Response Generation**
   - Return success/error status to client
   - Include message ID for tracking
   - Client displays appropriate user message

### Data Retention Policy
- **Contact Messages**: Retained indefinitely for business purposes
- **CloudWatch Logs**: 30-day retention period
- **Access Logs**: 90-day retention via Amplify

---

## Security Review

### Current Security Measures

#### ✅ **Implemented**
- **HTTPS Enforcement**: All traffic encrypted via CloudFront
- **Input Validation**: Field length limits and email format validation
- **Rate Limiting**: Client-side (1 minute) and API Gateway (1000/day)
- **CORS Configuration**: Restricted to website domain
- **IAM Least Privilege**: Lambda role has minimal required permissions
- **Data Encryption**: DynamoDB encrypted at rest with AWS managed keys
- **Content Security**: No user-generated content or file uploads

#### ⚠️ **Security Concerns**

1. **API Endpoint Exposure**
   - **Issue**: API Gateway endpoint is publicly accessible
   - **Risk**: Potential for abuse or spam
   - **Mitigation**: Rate limiting in place, but could be enhanced

2. **No Request Authentication**
   - **Issue**: No API key or authentication required
   - **Risk**: Unauthorized usage
   - **Current Mitigation**: Rate limiting and input validation

3. **Email Address Exposure**
   - **Issue**: SES configuration visible in Lambda environment
   - **Risk**: Low, but could use Secrets Manager
   - **Current Mitigation**: IAM role restrictions

### Recommended Security Improvements

#### 🔒 **High Priority**

1. **Implement AWS WAF**
   ```yaml
   # Add to API Gateway
   - SQL injection protection
   - XSS protection  
   - IP reputation filtering
   - Geographic restrictions if needed
   ```

2. **Enhanced Rate Limiting**
   ```javascript
   // Add to Lambda function
   - Per-email address limiting
   - Exponential backoff for repeated attempts
   - CAPTCHA integration for suspicious activity
   ```

3. **Input Sanitization Enhancement**
   ```javascript
   // Strengthen validation
   - HTML entity encoding
   - Profanity filtering
   - Spam keyword detection
   ```

#### 🔐 **Medium Priority**

4. **AWS Secrets Manager Integration**
   ```json
   // Store sensitive configuration
   {
     "ses_from_email": "noreply@ryan-lingo.com",
     "ses_to_email": "contact@ryan-lingo.com",
     "admin_notification_webhook": "https://..."
   }
   ```

5. **CloudWatch Alarms**
   ```yaml
   # Monitor for security events
   - Unusual request patterns
   - High error rates
   - Failed authentication attempts
   - DynamoDB throttling
   ```

6. **Content Security Policy (CSP)**
   ```html
   <!-- Add to HTML head -->
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; 
                  script-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
                  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;">
   ```

#### 🛡️ **Low Priority**

7. **API Key Authentication**
   - Implement API Gateway API keys for additional security layer
   - Rotate keys regularly via automation

8. **Request Signing**
   - Implement AWS Signature Version 4 for API requests
   - Adds cryptographic authentication

---

## Monitoring & Logging

### Current Monitoring Setup

#### AWS CloudWatch Integration
- **Lambda Logs**: Automatic logging of function execution
- **API Gateway Logs**: Request/response logging and metrics
- **Amplify Logs**: Build and deployment logs
- **DynamoDB Metrics**: Read/write capacity and throttling

#### Key Metrics Tracked
```yaml
Lambda Function:
  - Invocation count
  - Duration
  - Error rate
  - Memory utilization

API Gateway:
  - Request count
  - Latency (4XX/5XX errors)
  - Integration latency
  - Cache hit/miss ratio

DynamoDB:
  - Read/write capacity units
  - Throttled requests
  - System errors
  - Item count

Amplify:
  - Build success/failure rate
  - Deployment duration
  - Traffic metrics
```

### Recommended Monitoring Enhancements

#### 📊 **CloudWatch Dashboards**
Create custom dashboard with:
- Real-time request volume
- Error rate trends
- Response time percentiles
- Cost tracking widgets

#### 🚨 **CloudWatch Alarms**
```yaml
Critical Alarms:
  - Lambda error rate > 5%
  - API Gateway 5XX errors > 10/hour
  - DynamoDB throttling events
  - Unusual traffic spikes (>1000 requests/hour)

Warning Alarms:
  - Lambda duration > 10 seconds
  - API Gateway latency > 5 seconds
  - High memory utilization
  - Cost threshold exceeded
```

#### 📈 **Enhanced Logging**
```javascript
// Add structured logging to Lambda
const log = {
    timestamp: new Date().toISOString(),
    requestId: context.awsRequestId,
    level: 'INFO',
    message: 'Contact form submitted',
    metadata: {
        email: email,
        ipAddress: sourceIp,
        userAgent: userAgent
    }
};
console.log(JSON.stringify(log));
```

---

## Version Control & Deployment

### Git Workflow
- **Repository**: GitHub (private repository)
- **Branching Strategy**: 
  - `main` branch: Production-ready code
  - `development` branch: Integration testing
  - Feature branches: Individual development work

### CI/CD Pipeline

#### AWS Amplify Configuration
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    build:
      commands:
        - echo "Static site - no build needed"
  artifacts:
    baseDirectory: .
    files:
      - '**/*'
  customHeaders:
    - pattern: '**/*.czml'
      headers:
        - key: 'Content-Type'
          value: 'application/json'
```

#### Deployment Process
1. **Code Push**: Developer pushes to GitHub branch
2. **Automatic Trigger**: Amplify detects changes via webhook
3. **Build Phase**: Amplify runs build commands (minimal for static site)
4. **Artifact Generation**: All files packaged for deployment
5. **Deployment**: Files uploaded to S3 and CloudFront cache invalidated
6. **Verification**: Amplify runs basic health checks

#### Branch Deployment Strategy
- **Main Branch**: Auto-deploys to production (ryan-lingo.com)
- **Development Branch**: Auto-deploys to staging (dev.ryan-lingo.com)
- **Feature Branches**: Manual deployment for testing

### Rollback Procedures

#### Amplify Rollback
```bash
# Via AWS CLI
aws amplify start-deployment \
  --app-id d35zfk5lpgtdjq \
  --branch-name main \
  --job-id [previous-successful-job-id]
```

#### Git Rollback
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or reset to specific commit
git reset --hard [commit-hash]
git push --force-with-lease origin main
```

#### Emergency Procedures
1. **Immediate**: Use Amplify console to rollback to last known good deployment
2. **Investigation**: Check CloudWatch logs for error details
3. **Fix**: Apply hotfix to main branch or revert problematic changes
4. **Verification**: Test deployment in staging before production

---

## Cost & Performance

### Current AWS Costs (Monthly Estimates)

#### Service Breakdown
```yaml
AWS Amplify:
  - Hosting: $0.00 (Free tier: 1GB storage, 15GB bandwidth)
  - Build minutes: $0.00 (Free tier: 1000 minutes)
  
API Gateway:
  - Requests: ~$0.35 (1M requests = $3.50, expecting ~100K)
  - Data transfer: ~$0.09 (1GB = $0.09)

Lambda:
  - Invocations: $0.00 (Free tier: 1M requests)
  - Compute time: $0.00 (Free tier: 400,000 GB-seconds)

DynamoDB:
  - On-demand: ~$1.25 per million write requests
  - Storage: ~$0.25 per GB per month
  - Expected: <$5/month for typical usage

SES:
  - Email sending: $0.10 per 1,000 emails
  - Expected: <$1/month

CloudWatch:
  - Logs: $0.50 per GB ingested
  - Metrics: $0.30 per metric per month
  - Expected: <$5/month

Total Estimated Monthly Cost: $10-15
```

### Performance Optimizations

#### ✅ **Current Optimizations**
- **CloudFront CDN**: Global content delivery with edge caching
- **Image Optimization**: Manually optimized JPEG/PNG files
- **CSS/JS Minification**: Manual minification for production
- **Font Loading**: Preconnect to Google Fonts for faster loading
- **Lazy Loading**: Images loaded as needed
- **Gzip Compression**: Enabled via CloudFront

#### 🚀 **Recommended Improvements**

1. **Image Optimization Pipeline**
   ```yaml
   # Add to build process
   - WebP format conversion
   - Responsive image sizes
   - Automatic compression
   - Progressive JPEG encoding
   ```

2. **Caching Strategy Enhancement**
   ```yaml
   CloudFront Cache Behaviors:
     Static Assets (CSS/JS/Images):
       - TTL: 1 year
       - Compress: Yes
     HTML Files:
       - TTL: 1 hour
       - Compress: Yes
     API Responses:
       - TTL: No cache
   ```

3. **Performance Monitoring**
   ```javascript
   // Add to pages
   - Core Web Vitals tracking
   - Real User Monitoring (RUM)
   - Lighthouse CI integration
   ```

### Cost Optimization Strategies

#### 💰 **Immediate Savings**
1. **DynamoDB Optimization**
   - Use on-demand billing (current setup is optimal)
   - Implement TTL for old contact messages if desired
   - Monitor for unused indexes

2. **Lambda Optimization**
   - Right-size memory allocation (128MB is appropriate)
   - Optimize cold start performance
   - Use provisioned concurrency only if needed

3. **CloudWatch Cost Control**
   - Set log retention periods (30 days recommended)
   - Filter unnecessary log entries
   - Use CloudWatch Insights for efficient querying

#### 📊 **Cost Monitoring**
```yaml
# Set up billing alerts
- Monthly budget: $25
- Alert thresholds: 50%, 80%, 100%
- Cost anomaly detection enabled
- Service-level cost allocation tags
```

---

## Backup & Recovery

### Data Backup Strategy

#### 🗄️ **DynamoDB Backup**
```yaml
Current Setup:
  - Point-in-time recovery: Enabled (35-day retention)
  - On-demand backups: Manual creation recommended
  - Cross-region replication: Not configured (consider for DR)

Backup Schedule:
  - Daily: Automatic point-in-time recovery
  - Weekly: Manual on-demand backup
  - Monthly: Export to S3 for long-term retention
```

#### 📁 **Code Repository Backup**
```yaml
Primary: GitHub repository
Secondary: 
  - Local developer machines
  - AWS CodeCommit mirror (optional)
  - Periodic zip exports to S3
```

#### 🌐 **Static Asset Backup**
```yaml
Primary: Amplify S3 bucket
Secondary:
  - GitHub repository (source files)
  - CloudFront edge locations (cached copies)
  - Manual S3 cross-region replication (optional)
```

### Disaster Recovery Plan

#### 🚨 **Recovery Time Objectives (RTO)**
- **Website Outage**: 15 minutes (Amplify rollback)
- **Contact Form Failure**: 1 hour (Lambda redeployment)
- **Database Corruption**: 4 hours (DynamoDB restore)
- **Complete AWS Region Failure**: 24 hours (multi-region setup)

#### 🔄 **Recovery Procedures**

1. **Website Recovery**
   ```bash
   # Amplify rollback via CLI
   aws amplify start-deployment \
     --app-id d35zfk5lpgtdjq \
     --branch-name main \
     --job-id [last-good-deployment]
   ```

2. **Database Recovery**
   ```bash
   # DynamoDB point-in-time recovery
   aws dynamodb restore-table-to-point-in-time \
     --source-table-name portfolio-contact-messages \
     --target-table-name portfolio-contact-messages-restored \
     --restore-date-time 2024-10-16T10:00:00.000Z
   ```

3. **Lambda Function Recovery**
   ```bash
   # Redeploy from source
   aws lambda update-function-code \
     --function-name portfolio-contact-handler \
     --zip-file fileb://function.zip
   ```

### Business Continuity

#### 📧 **Alternative Contact Methods**
- LinkedIn profile link (always available)
- Email address in resume PDF
- GitHub profile contact information

#### 🔄 **Graceful Degradation**
- Contact form failure → Display alternative contact methods
- 3D visualization failure → Show static images
- Blog loading failure → Display cached content

---

## Future Expansion

### Planned Enhancements

#### 🔐 **Authentication System**
```yaml
Implementation Plan:
  - AWS Cognito User Pools
  - Social login (GitHub, LinkedIn)
  - Admin dashboard for content management
  - Protected routes for sensitive content

Architecture Changes:
  - Add Cognito authorizer to API Gateway
  - Implement JWT token validation
  - Create admin-only Lambda functions
  - Add user session management
```

#### 📊 **Analytics Integration**
```yaml
Options:
  1. AWS CloudWatch RUM (Real User Monitoring)
  2. Google Analytics 4 with privacy compliance
  3. Custom analytics via Lambda + DynamoDB

Metrics to Track:
  - Page views and user sessions
  - Contact form conversion rates
  - Blog post engagement
  - 3D visualization usage
  - Performance metrics (Core Web Vitals)
```

#### 🔍 **Search Functionality**
```yaml
Blog Search Implementation:
  - AWS OpenSearch Service
  - Client-side search with Fuse.js
  - Full-text search across blog posts
  - Tag-based filtering and categorization

Technical Requirements:
  - Search index generation pipeline
  - Auto-complete suggestions
  - Search analytics and optimization
```

#### 📝 **Content Management System**
```yaml
Headless CMS Options:
  1. AWS AppSync + DynamoDB
  2. Strapi on AWS ECS
  3. Custom Lambda-based CMS

Features:
  - Rich text editor for blog posts
  - Image upload and optimization
  - Draft/publish workflow
  - SEO metadata management
  - Content scheduling
```

### Scalability Considerations

#### 🚀 **Traffic Growth Planning**
```yaml
Current Capacity:
  - Amplify: 15GB bandwidth (free tier)
  - API Gateway: 1000 requests/day
  - Lambda: 1M invocations/month (free tier)

Scaling Triggers:
  - >10GB monthly bandwidth → Upgrade Amplify plan
  - >500 requests/day → Increase API Gateway limits
  - >100K Lambda invocations → Monitor costs

Auto-scaling Setup:
  - CloudWatch alarms for traffic thresholds
  - Automatic scaling for Lambda (built-in)
  - DynamoDB on-demand scaling (current setup)
```

#### 🌍 **Multi-Region Deployment**
```yaml
Phase 1: Primary region (us-east-1)
Phase 2: Add secondary region (eu-west-1)
  - Route 53 health checks
  - Cross-region DynamoDB replication
  - Multi-region Lambda deployment
  - CloudFront origin failover
```

### Integration Roadmap

#### 🔌 **Third-Party Integrations**
```yaml
Priority 1:
  - Newsletter signup (Mailchimp/ConvertKit)
  - Social media sharing buttons
  - Comment system (Disqus/custom)

Priority 2:
  - Payment processing (Stripe) for consulting
  - Calendar booking (Calendly integration)
  - Live chat support (AWS Connect)

Priority 3:
  - AI-powered content recommendations
  - Automated social media posting
  - Advanced SEO tools integration
```

#### 🛠️ **Development Tools**
```yaml
Code Quality:
  - ESLint + Prettier configuration
  - Automated testing with Jest
  - Lighthouse CI for performance
  - Security scanning with Snyk

Deployment:
  - Infrastructure as Code (CDK/Terraform)
  - Automated database migrations
  - Blue/green deployment strategy
  - Canary releases for major changes
```

---

## Security Checklist

| Security Control | Status | Priority | Notes |
|------------------|--------|----------|-------|
| **Network Security** |
| HTTPS Enforcement | ✅ Implemented | High | CloudFront handles SSL/TLS |
| CORS Configuration | ✅ Implemented | High | Restricted to website domain |
| API Rate Limiting | ⚠️ Basic | High | API Gateway + client-side limits |
| WAF Protection | ❌ Not Implemented | High | **Recommended addition** |
| **Authentication & Authorization** |
| API Authentication | ❌ Public endpoint | Medium | Consider API keys for enhanced security |
| IAM Least Privilege | ✅ Implemented | High | Lambda role has minimal permissions |
| Access Key Rotation | ⚠️ Manual | Medium | **Implement automated rotation** |
| **Data Protection** |
| Encryption at Rest | ✅ Implemented | High | DynamoDB uses AWS managed keys |
| Encryption in Transit | ✅ Implemented | High | HTTPS everywhere |
| Input Validation | ⚠️ Basic | High | **Enhance with sanitization** |
| Output Encoding | ❌ Not Implemented | Medium | **Add HTML entity encoding** |
| **Monitoring & Logging** |
| CloudWatch Logging | ✅ Implemented | High | Lambda and API Gateway logs |
| Security Monitoring | ❌ Not Implemented | Medium | **Add security-focused alarms** |
| Audit Trail | ⚠️ Basic | Medium | DynamoDB stores contact attempts |
| **Incident Response** |
| Backup Strategy | ✅ Implemented | High | DynamoDB point-in-time recovery |
| Rollback Procedures | ✅ Documented | High | Amplify and Git rollback plans |
| Emergency Contacts | ✅ Documented | High | Alternative contact methods available |
| **Compliance** |
| Data Retention Policy | ⚠️ Informal | Low | **Document formal policy** |
| Privacy Policy | ❌ Not Implemented | Medium | **Add privacy policy page** |
| GDPR Compliance | ❌ Not Assessed | Low | Consider if targeting EU users |

### Legend
- ✅ **Implemented**: Security control is properly configured
- ⚠️ **Partial**: Basic implementation, needs enhancement  
- ❌ **Missing**: Security control not implemented

---

## Glossary

### AWS Services
- **Amplify**: AWS service for hosting static websites with CI/CD
- **API Gateway**: Managed service for creating and managing REST APIs
- **CloudFront**: Content Delivery Network (CDN) for global content distribution
- **CloudWatch**: Monitoring and logging service for AWS resources
- **DynamoDB**: NoSQL database service with automatic scaling
- **Lambda**: Serverless compute service for running code without servers
- **S3**: Simple Storage Service for object storage
- **SES**: Simple Email Service for sending transactional emails

### Technical Terms
- **CDN**: Content Delivery Network - geographically distributed servers for faster content delivery
- **CORS**: Cross-Origin Resource Sharing - security feature controlling cross-domain requests
- **CSP**: Content Security Policy - security standard preventing XSS attacks
- **CZML**: Cesium Markup Language - JSON format for 3D geospatial visualization
- **IAM**: Identity and Access Management - AWS service for controlling access to resources
- **PWA**: Progressive Web App - web application with native app-like features
- **RTO**: Recovery Time Objective - target time for service restoration after incident
- **SPA**: Single Page Application - web app that loads a single HTML page
- **TTL**: Time To Live - duration for which data is cached
- **UUID**: Universally Unique Identifier - 128-bit identifier for database records
- **WAF**: Web Application Firewall - security service protecting against web exploits
- **XSS**: Cross-Site Scripting - security vulnerability allowing malicious script injection

### Performance Metrics
- **Core Web Vitals**: Google's metrics for measuring user experience (LCP, FID, CLS)
- **FCP**: First Contentful Paint - time until first content appears
- **LCP**: Largest Contentful Paint - time until largest content element loads
- **TTFB**: Time To First Byte - time until first byte received from server

---

## Document Information

**Version**: 1.0  
**Last Updated**: October 16, 2024  
**Author**: Ryan Charles Lingo  
**Review Schedule**: Quarterly  
**Next Review**: January 16, 2025  

**Document Status**: ✅ Current and Accurate

---

*This documentation follows AWS Well-Architected Framework principles and incorporates security best practices for serverless applications.*