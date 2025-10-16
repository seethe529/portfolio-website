# Quick Reference Guide - Ryan Lingo Portfolio

## 🚀 Essential Information

### Live URLs
- **Production**: https://ryan-lingo.com
- **Development**: https://development.d35zfk5lpgtdjq.amplifyapp.com
- **API Endpoint**: https://lpgzsfaxr3.execute-api.us-east-1.amazonaws.com/prod

### Repository
- **GitHub**: https://github.com/seethe529/portfolio-website
- **Branches**: `main` (production), `development` (staging)

---

## 🔧 Common Operations

### Deploy to Production
```bash
# Method 1: Git push (automatic)
git checkout main
git merge development
git push origin main

# Method 2: Amplify Console
# Navigate to AWS Amplify → Apps → portfolio → main branch → Redeploy
```

### Rollback Deployment
```bash
# Via AWS CLI
aws amplify start-deployment \
  --app-id d35zfk5lpgtdjq \
  --branch-name main \
  --job-id [previous-job-id]

# Via Git
git revert HEAD
git push origin main
```

### Check System Status
```bash
# Website health
curl -I https://ryan-lingo.com

# API health  
curl -X POST https://lpgzsfaxr3.execute-api.us-east-1.amazonaws.com/prod \
  -H "Content-Type: application/json" \
  -d '{"test": true}'

# Lambda logs
aws logs tail /aws/lambda/portfolio-contact-handler --follow
```

---

## 📊 Monitoring Dashboard

### Key Metrics to Watch
- **Website Uptime**: CloudFront distribution status
- **API Response Time**: <2 seconds average
- **Error Rate**: <1% for 4XX/5XX errors
- **Contact Form Success**: >95% success rate
- **Monthly Costs**: <$15 target

### CloudWatch Alarms
```yaml
Critical Alarms:
  - Lambda error rate > 5%
  - API Gateway 5XX errors > 10/hour
  - DynamoDB throttling events
  - Monthly cost > $25

Warning Alarms:
  - Response time > 5 seconds
  - Unusual traffic patterns
  - Build failures
```

---

## 🛠️ Troubleshooting

### Common Issues

#### Website Not Loading
1. Check CloudFront distribution status
2. Verify Amplify deployment status
3. Check DNS resolution
4. Review CloudWatch logs

#### Contact Form Failing
1. Test API endpoint directly
2. Check Lambda function logs
3. Verify DynamoDB table status
4. Check SES sending limits

#### Blog Posts Not Displaying
1. Verify `posts.json` format
2. Check JavaScript console errors
3. Validate individual post HTML
4. Clear browser cache

### Emergency Procedures
```bash
# 1. Immediate rollback
aws amplify start-deployment --app-id d35zfk5lpgtdjq --branch-name main --job-id [last-good-job]

# 2. Disable contact form (if needed)
# Comment out form submission handler in contact-form.js

# 3. Check all services
aws amplify get-app --app-id d35zfk5lpgtdjq
aws lambda get-function --function-name portfolio-contact-handler
aws dynamodb describe-table --table-name portfolio-contact-messages
```

---

## 📁 File Locations

### Critical Files
```
/index.html                           # Main landing page
/assets/scripts/contact-form.js       # Contact form handler
/blog/posts.json                      # Blog metadata
/amplify.yml                          # Build configuration
/docs/website-architecture.md         # This documentation
```

### AWS Resources
```yaml
Amplify App ID: d35zfk5lpgtdjq
Lambda Function: portfolio-contact-handler
DynamoDB Table: portfolio-contact-messages
API Gateway: lpgzsfaxr3
Region: us-east-1
```

---

## 🔐 Security Contacts

### Incident Response
1. **Immediate**: Disable affected service via AWS Console
2. **Investigate**: Check CloudWatch logs and metrics
3. **Communicate**: Update status page or social media
4. **Resolve**: Apply fix and verify resolution
5. **Document**: Record incident details and lessons learned

### Security Hotline
- **AWS Support**: Create support case for security issues
- **GitHub**: Report security vulnerabilities via private disclosure
- **Domain Issues**: Contact registrar support immediately

---

## 💰 Cost Management

### Monthly Budget Breakdown
```yaml
Expected Costs:
  - Amplify Hosting: $0 (free tier)
  - API Gateway: ~$0.35
  - Lambda: $0 (free tier)
  - DynamoDB: ~$5
  - SES: ~$1
  - CloudWatch: ~$5
  
Total: ~$11-15/month
```

### Cost Alerts
- 50% of budget: $12.50
- 80% of budget: $20.00
- 100% of budget: $25.00

---

## 📞 Support Contacts

| Service | Contact Method | Response Time |
|---------|----------------|---------------|
| **AWS Support** | Console → Support Center | 24 hours |
| **GitHub** | Support ticket | 24-48 hours |
| **Domain Registrar** | Phone/Chat | Immediate |
| **Google Fonts** | Community forum | Best effort |

---

## 🔄 Maintenance Schedule

### Weekly
- [ ] Review CloudWatch metrics
- [ ] Check for security updates
- [ ] Verify backup status
- [ ] Monitor costs

### Monthly  
- [ ] Review and rotate access keys
- [ ] Update dependencies
- [ ] Performance optimization review
- [ ] Security posture assessment

### Quarterly
- [ ] Full security audit
- [ ] Disaster recovery test
- [ ] Documentation updates
- [ ] Architecture review

---

## 📋 Checklists

### Pre-Deployment Checklist
- [ ] Code reviewed and tested
- [ ] No hardcoded secrets
- [ ] Documentation updated
- [ ] Backup created
- [ ] Rollback plan ready

### Post-Deployment Checklist
- [ ] Website loads correctly
- [ ] Contact form functional
- [ ] Blog posts display
- [ ] 3D visualization works
- [ ] Mobile responsive
- [ ] Performance acceptable

### Security Incident Checklist
- [ ] Identify affected systems
- [ ] Contain the incident
- [ ] Assess impact and scope
- [ ] Notify stakeholders
- [ ] Implement fixes
- [ ] Verify resolution
- [ ] Document lessons learned

---

**Last Updated**: October 16, 2024  
**Version**: 1.0  
**Owner**: Ryan Charles Lingo