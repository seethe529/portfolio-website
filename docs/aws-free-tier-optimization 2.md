# AWS Free Tier Optimization Guide

## Current Usage Analysis

### Your Current Stack (Free Tier Friendly ✅)
- **AWS Amplify**: Static hosting - FREE for basic usage
- **Contact Form**: Uses Lambda + DynamoDB + API Gateway
- **Domain**: Route 53 (if using custom domain)

## Free Tier Limits & Current Usage

### AWS Amplify (Always Free)
- ✅ **Build Minutes**: 1,000/month (you use ~5-10/month)
- ✅ **Storage**: 15GB (your site: ~50MB)
- ✅ **Data Transfer**: 15GB/month
- **Cost**: $0/month for your usage

### AWS Lambda (12 Months Free)
- ✅ **Requests**: 1M/month (contact form: ~100-500/month)
- ✅ **Compute Time**: 400,000 GB-seconds/month
- **Current Risk**: LOW - contact forms are lightweight
- **Cost**: $0/month within free tier

### DynamoDB (Always Free)
- ✅ **Storage**: 25GB (contact forms: <1MB/month)
- ✅ **Read/Write**: 25 units each (very low usage)
- **Cost**: $0/month for your usage

### API Gateway (12 Months Free)
- ✅ **API Calls**: 1M/month (contact form submissions)
- **Current Risk**: LOW
- **Cost**: $0/month within free tier

### Route 53 (NOT FREE)
- ❌ **Hosted Zone**: $0.50/month per domain
- ❌ **DNS Queries**: $0.40 per million queries
- **Monthly Cost**: ~$0.50-1.00/month

## Cost Reduction Strategies

### 1. Eliminate Route 53 (Save $6-12/year)
**Option A: Use Amplify Default Domain**
```
https://[app-id].amplifyapp.com
```
- **Savings**: $6-12/year
- **Trade-off**: Less professional URL

**Option B: Use Free Domain Services**
- **Freenom**: .tk, .ml, .ga domains (free)
- **GitHub Pages**: username.github.io (free)
- **Netlify**: Custom subdomain (free)

### 2. Optimize Lambda Function
**Current contact-form.js optimization:**

```javascript
// Minimize payload size
const submitForm = async (formData) => {
    const payload = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        subject: formData.subject.trim(),
        message: formData.message.trim().substring(0, 1000) // Limit message length
    };
    
    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        return response.json();
    } catch (error) {
        console.error('Form submission error:', error);
        throw error;
    }
};
```

### 3. Image Optimization (Reduce Bandwidth)
**Current images to optimize:**
- `professional-banner.jpeg` (~2-5MB)
- `ryan-lingo-headshot.jpg` (~1-3MB)

**Optimization steps:**
```bash
# Compress images (use online tools or CLI)
# Target: <500KB per image
# Format: WebP for better compression
```

### 4. CSS/JS Minification
**Minify styles.css:**
- Remove comments and whitespace
- Combine similar selectors
- **Potential savings**: 30-50% file size reduction

### 5. Implement Caching Headers
**Add to Amplify build settings:**
```yaml
# amplify.yml
version: 1
frontend:
  phases:
    build:
      commands:
        - echo "Build completed"
  artifacts:
    baseDirectory: /
    files:
      - '**/*'
  cache:
    paths:
      - 'assets/**/*'
```

## Free Tier Monitoring Setup

### 1. AWS Billing Alerts
**Set up in AWS Console:**
1. Go to Billing & Cost Management
2. Create billing alert for $1.00/month
3. Set up SNS notification to your email

### 2. CloudWatch Alarms (Free)
**Monitor Lambda invocations:**
```
Metric: AWS/Lambda/Invocations
Threshold: >500/month
Action: Email notification
```

### 3. Usage Tracking Script
**Add to your local development:**
```bash
#!/bin/bash
# check-aws-usage.sh
echo "Checking AWS Free Tier Usage..."
aws cloudwatch get-metric-statistics \
  --namespace AWS/Lambda \
  --metric-name Invocations \
  --start-time $(date -d '1 month ago' -u +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 2592000 \
  --statistics Sum
```

## Alternative Free Solutions

### 1. GitHub Pages (Completely Free)
**Pros:**
- 100% free hosting
- Custom domain support (free)
- Automatic SSL
- Git-based deployment

**Cons:**
- No server-side processing (no contact form backend)
- Static sites only

### 2. Netlify Free Tier
**Pros:**
- 100GB bandwidth/month
- Form handling (100 submissions/month)
- Custom domain support
- Serverless functions (125k requests/month)

**Migration consideration:**
- Could replace your entire AWS stack
- Built-in form handling without Lambda/DynamoDB

### 3. Vercel Free Tier
**Pros:**
- Unlimited static sites
- Serverless functions
- Custom domains
- 100GB bandwidth

## Recommended Optimizations (Immediate)

### 1. Image Compression
```bash
# Use online tools to compress:
# - professional-banner.jpeg: Target <300KB
# - ryan-lingo-headshot.jpg: Target <200KB
# - Convert to WebP format if possible
```

### 2. Remove Unused CSS
**Audit styles.css for unused rules:**
- Remove unused animations
- Combine similar selectors
- Minimize custom properties

### 3. Optimize Contact Form
**Limit form submissions:**
```javascript
// Add rate limiting
let lastSubmission = 0;
const RATE_LIMIT = 60000; // 1 minute

function canSubmit() {
    const now = Date.now();
    if (now - lastSubmission < RATE_LIMIT) {
        return false;
    }
    lastSubmission = now;
    return true;
}
```

### 4. Set Up Monitoring
**Create billing alert immediately:**
1. AWS Console → Billing
2. Set $1.00 threshold
3. Add email notification

## Long-term Cost Projections

### Current Setup (Optimized)
- **Year 1**: $6-12 (Route 53 only)
- **Year 2+**: $6-12 + potential Lambda/API Gateway costs
- **Risk**: Low, well within free tier limits

### Alternative (GitHub Pages + Netlify Forms)
- **All years**: $0
- **Trade-off**: Less AWS experience showcase

## Action Items

### Immediate (This Week)
1. ✅ Set up AWS billing alert ($1.00)
2. ✅ Compress images (<500KB each)
3. ✅ Add rate limiting to contact form

### Short-term (This Month)
1. ✅ Minify CSS and remove unused styles
2. ✅ Monitor usage for first month
3. ✅ Consider domain alternatives

### Long-term (3-6 Months)
1. ✅ Evaluate actual usage vs. free tier limits
2. ✅ Consider migration to Netlify if costs exceed $2/month
3. ✅ Optimize based on real usage patterns

## Cost Comparison Summary

| Solution | Year 1 Cost | Year 2+ Cost | Pros | Cons |
|----------|-------------|--------------|------|------|
| Current AWS | $6-12 | $6-12 | Full AWS stack, professional | Route 53 cost |
| AWS (no custom domain) | $0 | $0 | Free, AWS experience | Less professional URL |
| Netlify | $0 | $0 | Free, easy forms | Less AWS showcase |
| GitHub Pages | $0 | $0 | Completely free | No backend forms |

**Recommendation**: Keep current setup with optimizations. The $6-12/year cost is minimal for a professional portfolio showcasing AWS skills.