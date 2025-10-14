# Portfolio Website Tech Stack Documentation

## Architecture Overview
This portfolio website is built using modern cloud-native technologies with AWS services providing the backend infrastructure and a responsive frontend design.

## Frontend Technologies

### HTML5
- **Purpose**: Semantic markup and structure
- **Key Features**: 
  - Semantic elements (`<section>`, `<header>`, `<main>`)
  - Accessibility attributes (alt text, proper heading hierarchy)
  - Form elements with validation
- **Documentation**: [MDN HTML Reference](https://developer.mozilla.org/en-US/docs/Web/HTML)

### CSS3
- **Purpose**: Styling, animations, and responsive design
- **Key Features**:
  - CSS Grid and Flexbox layouts
  - Custom properties (CSS variables)
  - Media queries for responsive design
  - Backdrop filters and glass morphism effects
  - CSS animations and transitions
- **Documentation**: [MDN CSS Reference](https://developer.mozilla.org/en-US/docs/Web/CSS)

### JavaScript (ES6+)
- **Purpose**: Contact form functionality and interactivity
- **Key Features**:
  - Async/await for API calls
  - Form validation and submission
  - Error handling and user feedback
- **Documentation**: [MDN JavaScript Reference](https://developer.mozilla.org/en-US/docs/Web/JavaScript)

### Google Fonts
- **Font Family**: Inter (weights: 300, 400, 500, 600, 700)
- **Purpose**: Modern, readable typography
- **Documentation**: [Google Fonts](https://fonts.google.com/)

## AWS Cloud Services

### AWS Amplify
- **Purpose**: Static site hosting and CI/CD
- **Features**:
  - Automatic deployments from GitHub
  - Custom domain with SSL/TLS
  - Global CDN distribution
  - Branch-based deployments
- **Documentation**: [AWS Amplify Docs](https://docs.aws.amazon.com/amplify/)
- **Console**: [AWS Amplify Console](https://console.aws.amazon.com/amplify/)

### AWS Lambda
- **Purpose**: Serverless contact form processing
- **Runtime**: Python 3.x
- **Features**:
  - Form data processing
  - Email notifications
  - Input validation and sanitization
- **Documentation**: [AWS Lambda Docs](https://docs.aws.amazon.com/lambda/)

### Amazon DynamoDB
- **Purpose**: Contact form data storage
- **Features**:
  - NoSQL database for form submissions
  - Automatic scaling
  - Built-in security
- **Documentation**: [DynamoDB Docs](https://docs.aws.amazon.com/dynamodb/)

### Amazon API Gateway
- **Purpose**: REST API for contact form
- **Features**:
  - CORS configuration
  - Request/response transformation
  - Rate limiting and throttling
- **Documentation**: [API Gateway Docs](https://docs.aws.amazon.com/apigateway/)

### Amazon Route 53
- **Purpose**: DNS management and domain routing
- **Features**:
  - Custom domain configuration
  - Health checks
  - Traffic routing
- **Documentation**: [Route 53 Docs](https://docs.aws.amazon.com/route53/)

## Development Tools

### Git & GitHub
- **Purpose**: Version control and source code management
- **Repository**: Connected to AWS Amplify for automatic deployments
- **Documentation**: [Git Documentation](https://git-scm.com/doc)

### GitHub Desktop
- **Purpose**: GUI for Git operations
- **Features**: Visual diff, branch management, commit history
- **Documentation**: [GitHub Desktop Docs](https://docs.github.com/en/desktop)

## Project Structure
```
MyWebsite-deploy/
├── index.html              # Main HTML file
├── styles.css              # Main stylesheet
├── contact-form.js         # Contact form JavaScript
├── assets/
│   ├── images/
│   │   ├── professional-banner.jpeg
│   │   └── ryan-lingo-headshot.jpg
│   └── documents/
│       └── ryan-lingo-resume.pdf
├── amplify/                # AWS Amplify configuration
├── package.json            # Node.js dependencies
└── .gitignore             # Git ignore rules
```

## Key Features Implemented

### Responsive Design
- **Mobile-first approach** with progressive enhancement
- **Breakpoints**: 768px (tablet), 480px (mobile)
- **Flexible layouts** using CSS Grid and Flexbox

### Space-Themed Design
- **Glass morphism effects** with backdrop filters
- **Gradient backgrounds** and cosmic animations
- **Subtle particle effects** and glowing borders
- **Orange/amber color scheme** (#ff6b35, #ff8c00)

### Contact Form Integration
- **Client-side validation** with JavaScript
- **AWS Lambda backend** for form processing
- **DynamoDB storage** for form submissions
- **Email notifications** via AWS SES (if configured)

### Performance Optimizations
- **Optimized images** with proper alt text
- **Minified CSS** and efficient selectors
- **CDN delivery** via AWS Amplify
- **Lazy loading** considerations for images

## Deployment Process

### Automatic Deployment
1. **Code changes** pushed to GitHub main branch
2. **AWS Amplify** detects changes via webhook
3. **Build process** runs automatically
4. **Static files** deployed to global CDN
5. **Custom domain** updated with new version

### Manual Deployment
1. Access AWS Amplify Console
2. Navigate to your app
3. Click "Redeploy this version" on main branch

## Environment Configuration

### Local Development
```bash
# Clone repository
git clone [repository-url]

# Navigate to project
cd MyWebsite-deploy

# Open in browser
open index.html
```

### AWS Configuration
- **Region**: us-east-1 (recommended for Amplify)
- **Custom Domain**: Configure in Amplify Console
- **SSL Certificate**: Automatically managed by Amplify

## Monitoring and Analytics

### AWS CloudWatch
- **Lambda function logs** for contact form
- **API Gateway metrics** for form submissions
- **Amplify build logs** for deployment status

### Amplify Analytics (Optional)
- **User engagement** tracking
- **Page views** and session data
- **Performance metrics**

## Security Considerations

### HTTPS/SSL
- **Automatic SSL** certificate via AWS Certificate Manager
- **Force HTTPS** redirect configured in Amplify

### Form Security
- **Input validation** on client and server side
- **CORS configuration** to prevent unauthorized access
- **Rate limiting** via API Gateway

### Content Security
- **No sensitive data** in client-side code
- **Environment variables** for API endpoints
- **Proper error handling** without exposing system details

## Maintenance Tasks

### Regular Updates
- **Monitor AWS costs** in billing dashboard
- **Update dependencies** in package.json
- **Review CloudWatch logs** for errors
- **Test contact form** functionality monthly

### Content Updates
- **Resume PDF** updates in assets/documents/
- **Professional photos** in assets/images/
- **Technical skills** section updates
- **Experience descriptions** updates

## Useful Commands

### Git Operations
```bash
# Check status
git status

# Add changes
git add .

# Commit changes
git commit -m "Update content"

# Push to trigger deployment
git push origin main
```

### AWS CLI (if needed)
```bash
# Configure AWS CLI
aws configure

# List Amplify apps
aws amplify list-apps

# Get app details
aws amplify get-app --app-id [app-id]
```

## Troubleshooting

### Common Issues
1. **Deployment fails**: Check build logs in Amplify Console
2. **Contact form not working**: Verify Lambda function and API Gateway
3. **Images not loading**: Check file paths and case sensitivity
4. **Mobile layout issues**: Test responsive breakpoints

### Support Resources
- **AWS Support**: [AWS Support Center](https://console.aws.amazon.com/support/)
- **Amplify Community**: [AWS Amplify Discord](https://discord.gg/amplify)
- **Documentation**: All links provided in respective sections above

## Cost Optimization

### AWS Free Tier Usage
- **Amplify**: 1000 build minutes/month, 15GB storage
- **Lambda**: 1M requests/month, 400,000 GB-seconds
- **DynamoDB**: 25GB storage, 25 read/write capacity units
- **API Gateway**: 1M API calls/month

### Monitoring Costs
- **AWS Billing Dashboard**: Monitor monthly usage
- **Cost Alerts**: Set up billing alerts for budget management
- **Resource cleanup**: Remove unused resources regularly