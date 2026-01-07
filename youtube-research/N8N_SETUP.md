# n8n Workflow Setup Guide

This guide walks you through setting up the automated YouTube Outlier Report workflow on your self-hosted n8n instance.

## Overview

The workflow:
- Runs every **Monday at 9 AM** (or manually triggered)
- Searches 20 running/fitness keywords on YouTube
- Finds videos with high views from small channels
- Calculates outlier scores (views / subscribers)
- Sends a beautiful HTML email to **shredathletics96@gmail.com**

---

## Step 1: Create Credentials in n8n

### A. YouTube API Key Credential

1. Go to your n8n instance: https://n8n.srv1254680.hstgr.cloud/
2. Click **Settings** (gear icon) → **Credentials**
3. Click **Add Credential** → Search for **"HTTP Query Auth"**
4. Configure:
   - **Name:** `YouTube API Key`
   - **Parameter Name:** `key`
   - **Value:** Your YouTube API key (from Google Cloud Console)
5. Click **Save**

### B. Gmail SMTP Credential

1. Click **Add Credential** → Search for **"SMTP"**
2. Configure:
   - **Name:** `Gmail SMTP`
   - **Host:** `smtp.gmail.com`
   - **Port:** `465`
   - **SSL/TLS:** `true`
   - **User:** `shredathletics96@gmail.com`
   - **Password:** Your Gmail App Password (see below)
3. Click **Save**

#### Getting a Gmail App Password:
1. Go to https://myaccount.google.com/apppasswords
2. Sign in with your Google account
3. Select app: **Mail**
4. Select device: **Other** → Name it "n8n"
5. Click **Generate**
6. Copy the 16-character password (use this in n8n, not your regular password)

**Note:** You need 2-Factor Authentication enabled on your Google account to create app passwords.

---

## Step 2: Import the Workflow

1. Go to your n8n instance: https://n8n.srv1254680.hstgr.cloud/
2. Click **Workflows** in the sidebar
3. Click **Add Workflow** → **Import from File**
4. Upload the file: `n8n-workflow.json`
5. Click **Import**

---

## Step 3: Update Credential References

After importing, you need to link the credentials:

### Update YouTube API nodes:
1. Click on **"YouTube Search"** node
2. In the right panel, under **Authentication**, select your `YouTube API Key` credential
3. Repeat for **"Get Video Stats"** and **"Get Channel Stats"** nodes

### Update Email node:
1. Click on **"Send Email"** node
2. Under **Credential to connect with**, select your `Gmail SMTP` credential
3. Verify the **Send To** field shows `shredathletics96@gmail.com`

---

## Step 4: Test the Workflow

1. Click the **Manual Trigger** node (bottom left of canvas)
2. Click **Execute Workflow** (or press `Ctrl/Cmd + Enter`)
3. Watch the nodes execute one by one
4. Check your email for the report!

**Troubleshooting:**
- If YouTube nodes fail: Check your API key and quota
- If email fails: Verify SMTP credentials and app password
- If no outliers found: The search ran but didn't find qualifying videos (adjust parameters in "Calculate Outliers" node)

---

## Step 5: Activate the Workflow

1. Toggle the **Active** switch in the top-right corner
2. The workflow will now run automatically every Monday at 9 AM

---

## Workflow Nodes Explained

| Node | Purpose |
|------|---------|
| **Weekly Monday 9AM** | Schedule trigger - runs every Monday |
| **Manual Trigger** | For testing - click to run immediately |
| **Keywords List** | Contains 20 running/fitness search terms |
| **YouTube Search** | Searches YouTube API for each keyword |
| **Collect Unique Videos** | Deduplicates results |
| **Get Video Stats** | Fetches view counts, likes, comments |
| **Merge Video Stats** | Combines video data |
| **Get Channel Stats** | Fetches subscriber counts |
| **Calculate Outliers** | Filters and scores videos |
| **Format Email** | Creates beautiful HTML email |
| **Send Email** | Sends to your Gmail |

---

## Customization Options

### Change Search Keywords
Edit the **Keywords List** node to add/remove keywords:
```javascript
const keywords = [
  'marathon training tips',
  'your new keyword here',
  // ... add more
];
```

### Adjust Outlier Thresholds
Edit the **Calculate Outliers** node:
```javascript
const MIN_VIEWS = 5000;        // Minimum views to consider
const MAX_SUBSCRIBERS = 100000; // Max channel size
const MIN_OUTLIER_SCORE = 5;    // Minimum views/subs ratio
```

### Change Schedule
Edit the **Weekly Monday 9AM** node:
- Change day: `triggerAtDay: [1]` (1=Monday, 0=Sunday, etc.)
- Change time: `triggerAtHour: 9` (24-hour format)

### Change Email Recipient
Edit the **Send Email** node:
- Update the `sendTo` field

---

## API Quota Notes

YouTube Data API has a daily quota of 10,000 units:
- Each search: ~100 units
- Video details: ~1 unit per video
- Channel details: ~1 unit per channel

This workflow uses approximately **3,000-5,000 units** per run. You can safely run it 2-3 times per day.

---

## Troubleshooting

### "Quota exceeded" error
- Wait until midnight Pacific Time (quota resets)
- Or reduce the number of keywords in the Keywords List node

### "Invalid API key" error
- Verify your API key in Google Cloud Console
- Ensure YouTube Data API v3 is enabled

### Email not sending
- Check Gmail app password is correct
- Verify 2FA is enabled on your Google account
- Check spam folder

### No outliers found
- Normal if it's a slow week
- Try lowering MIN_VIEWS or MIN_OUTLIER_SCORE in Calculate Outliers node

---

## Support

Questions? Check the [n8n documentation](https://docs.n8n.io/) or open an issue in this repository.

---

*Built for Shred Athletics - Weekly content research automation*
