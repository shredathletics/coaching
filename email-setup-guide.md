# Email Form Submission Setup Guide

This guide will walk you through setting up your Shred Athletics contact form to submit data directly to your email, with an option to share submissions with another coach.

## Step 1: Create an EmailJS Account

1. Go to [EmailJS](https://www.emailjs.com/) and sign up for a free account
2. The free plan allows 200 emails per month, which should be sufficient for most small coaching businesses

## Step 2: Set Up an Email Service

1. In your EmailJS dashboard, go to "Email Services"
2. Click "Add New Service"
3. Select your email provider (Gmail, Outlook, etc.)
4. Follow the authentication steps to connect your email account
5. Name your service (e.g., "Shred Athletics Form")

## Step 3: Create an Email Template

1. In your EmailJS dashboard, go to "Email Templates"
2. Click "Create New Template"
3. Design your email template with the following content:

```
Subject: New Coaching Inquiry from {{name}}

You have received a new coaching inquiry from the Shred Athletics website:

Name: {{name}}
Email: {{email}}
Phone: {{phone}}
Instagram: {{instagram}}
Running Goal: {{goal}}
Message: {{message}}
Preferred Contact Method: {{contact_preference}}

Please respond to this inquiry within 24 hours.
```

4. Save your template and note the Template ID

## Step 4: Update Your Website

1. Open the `index.html` file in your website files
2. Find the EmailJS initialization code:
   ```javascript
   emailjs.init("YOUR_PUBLIC_KEY");
   ```
3. Replace "YOUR_PUBLIC_KEY" with your actual EmailJS public key (found in your EmailJS dashboard under "Account" > "API Keys")

4. Open the `script.js` file
5. Find these lines:
   ```javascript
   emailjs.send('default_service', 'template_id', {
   ```
6. Replace 'default_service' with your actual service ID (found in your EmailJS dashboard under "Email Services")
7. Replace 'template_id' with your actual template ID (found in your EmailJS dashboard under "Email Templates")

## Step 5: Set Up Email Forwarding (Optional)

To share form submissions with another coach:

### Option A: Using Email Forwarding
1. In your email account settings, set up an auto-forwarding rule
2. Configure it to forward emails with the subject "New Coaching Inquiry" to your colleague's email address

### Option B: Using a Shared Email Account
1. Create a dedicated email account for form submissions (e.g., inquiries@shredathletics.com)
2. Give both coaches access to this email account
3. Update your EmailJS service to use this shared email account

## Step 6: Test the Form

1. Open your website and fill out the contact form
2. Submit the form
3. Check your email - you should receive the form submission
4. If you set up forwarding, verify that your colleague also receives the email

## Troubleshooting

If your form submissions aren't being emailed:

1. **Check the Console**: Open your browser's developer tools (F12) and look for any errors in the console
2. **Verify API Keys**: Make sure you've entered the correct EmailJS public key, service ID, and template ID
3. **Check Email Spam Folder**: Sometimes the emails might be filtered as spam
4. **Verify Template Variables**: Ensure the variable names in your template match those in the script.js file

## Alternative: Simple Form-to-Email Service

If EmailJS doesn't work for your needs, consider these alternatives:

1. **Formspree**: A simple form-to-email service with a free tier
   - Sign up at [Formspree](https://formspree.io/)
   - Create a form endpoint
   - Update your form's action attribute to your Formspree endpoint

2. **Netlify Forms**: If your site is hosted on Netlify
   - Add `data-netlify="true"` to your form element
   - Netlify will automatically collect submissions

## Benefits of This Approach

1. **Simplicity**: No need to set up and maintain a Google Sheet
2. **Immediate Notifications**: Get notified immediately when someone submits the form
3. **Easy Sharing**: Forward emails to share with your coaching colleague
4. **No Google Account Required**: Works with any email provider
5. **Mobile Access**: Check submissions from your phone's email app 