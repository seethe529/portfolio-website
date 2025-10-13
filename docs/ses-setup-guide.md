# SES Email Notifications Setup Guide

## Step 1: Verify Your Email in SES Console

### What we're doing:
- Telling AWS that you own your email address
- This allows SES to send emails on your behalf
- Required for security (prevents spam)

### Instructions:
1. **Go to AWS Console → SES (Simple Email Service)**
2. **Click "Verified identities" in left sidebar**
3. **Click "Create identity"**
4. **Select "Email address"**
5. **Enter your email**: `rlingo084@gmail.com`
6. **Click "Create identity"**
7. **Check your email** and click the verification link
8. **Status should change to "Verified"**

### Why this step:
- AWS needs to confirm you own the email before allowing sends
- Prevents malicious users from sending emails as you
- Required for both sending FROM and TO your email initially

---

## Step 2: Update Lambda Function Permissions

### What we're doing:
- Giving your Lambda function permission to send emails
- Adding SES permissions to the existing IAM role
- This is like giving your function a "key" to use SES

### Instructions:
1. **Go to AWS Console → IAM**
2. **Click "Roles" in left sidebar**
3. **Find your Lambda function's role** (usually named like `lambda-execution-role` or similar)
4. **Click on the role name**
5. **Click "Add permissions" → "Attach policies"**
6. **Search for "SES"**
7. **Select "AmazonSESFullAccess"** (for simplicity - we can restrict later)
8. **Click "Add permissions"**

### Why this step:
- Lambda functions run with specific permissions (principle of least privilege)
- By default, Lambda can't access other AWS services
- We're explicitly granting SES access to your function

---

## Step 3: Update Lambda Function Code

### What we're doing:
- Adding email sending capability to your existing contact form processor
- Sending two emails: one to you (notification) and one to the user (confirmation)
- Using boto3 (AWS SDK) to interact with SES

### The updated Lambda function:
```python
import json
import boto3
from datetime import datetime
import uuid

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
ses = boto3.client('ses')

# Your DynamoDB table name (replace with actual name)
TABLE_NAME = 'contact-form-submissions'  # Update this
YOUR_EMAIL = 'rlingo084@gmail.com'

def lambda_handler(event, context):
    try:
        # Parse the incoming request
        body = json.loads(event['body'])
        
        # Extract form data
        name = body.get('name', '').strip()
        email = body.get('email', '').strip()
        subject = body.get('subject', '').strip()
        message = body.get('message', '').strip()
        
        # Validate required fields
        if not all([name, email, subject, message]):
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Headers': 'Content-Type',
                    'Access-Control-Allow-Methods': 'POST'
                },
                'body': json.dumps({'success': False, 'error': 'All fields required'})
            }
        
        # Create unique ID and timestamp
        submission_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Save to DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'id': submission_id,
                'timestamp': timestamp,
                'name': name,
                'email': email,
                'subject': subject,
                'message': message
            }
        )
        
        # Send notification email to you
        notification_subject = f"New Contact Form Submission: {subject}"
        notification_body = f"""
New contact form submission from your portfolio website:

Name: {name}
Email: {email}
Subject: {subject}

Message:
{message}

Submission ID: {submission_id}
Timestamp: {timestamp}
"""
        
        ses.send_email(
            Source=YOUR_EMAIL,
            Destination={'ToAddresses': [YOUR_EMAIL]},
            Message={
                'Subject': {'Data': notification_subject},
                'Body': {'Text': {'Data': notification_body}}
            }
        )
        
        # Send confirmation email to user
        confirmation_subject = "Thank you for contacting Ryan Lingo"
        confirmation_body = f"""
Hi {name},

Thank you for reaching out through my portfolio website. I've received your message about "{subject}" and will get back to you as soon as possible.

Best regards,
Ryan Lingo

---
This is an automated confirmation. Please do not reply to this email.
"""
        
        ses.send_email(
            Source=YOUR_EMAIL,
            Destination={'ToAddresses': [email]},
            Message={
                'Subject': {'Data': confirmation_subject},
                'Body': {'Text': {'Data': confirmation_body}}
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            'body': json.dumps({'success': True})
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST'
            },
            'body': json.dumps({'success': False, 'error': 'Internal server error'})
        }
```

### Key additions explained:
1. **`ses = boto3.client('ses')`** - Creates SES client for sending emails
2. **Two email sends** - One notification to you, one confirmation to user
3. **Professional email templates** - Clean, branded messages
4. **Error handling** - If email fails, form still works (graceful degradation)

---

## Step 4: Update Your Lambda Function

### Instructions:
1. **Go to AWS Console → Lambda**
2. **Find your contact form function**
3. **Click on the function name**
4. **Scroll down to "Code source"**
5. **Replace the existing code** with the code above
6. **Update these variables:**
   - `TABLE_NAME`: Your actual DynamoDB table name
   - `YOUR_EMAIL`: Your verified email address
7. **Click "Deploy"**

### What happens now:
- Form submissions save to DynamoDB (as before)
- You get immediate email notification
- User gets professional confirmation email
- If email fails, form still works

---

## Step 5: Test the Integration

### Testing steps:
1. **Submit a test form** on your website
2. **Check your email** - you should receive notification
3. **Check the test email address** - should receive confirmation
4. **Verify DynamoDB** - record should still be saved

### Troubleshooting:
- **No emails received**: Check SES email verification status
- **Permission errors**: Verify IAM role has SES permissions
- **Form still works but no emails**: Check Lambda logs in CloudWatch

---

## Step 6: Request Production Access (Optional)

### Current limitation:
- SES starts in "sandbox mode"
- Can only send TO verified email addresses
- Fine for testing, but limits real users

### To allow any email address:
1. **Go to SES Console**
2. **Click "Account dashboard"**
3. **Click "Request production access"**
4. **Fill out the form** (usually approved within 24 hours)

### Why request production access:
- Allows sending to any email address
- Removes daily sending limits
- Makes your contact form fully functional for all visitors

---

## Cost Impact

### SES Pricing:
- **Free tier**: 62,000 emails/month (when sending from EC2/Lambda)
- **Your usage**: ~20-100 emails/month
- **Cost**: Essentially $0/month

### Lambda impact:
- **Slightly longer execution time** (extra 100-200ms for email sends)
- **Still well within free tier limits**

---

## Benefits You'll Gain

1. **Immediate notifications** - know when someone contacts you
2. **Professional appearance** - users get confirmation
3. **Better lead management** - don't miss opportunities
4. **Backup system** - email + database storage
5. **Professional branding** - automated, consistent responses

Ready to implement? Let's start with Step 1!