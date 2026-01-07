# Slack Session Notifications Setup

Get notified in Slack whenever a client completes a training session. This guide walks you through setting up automated notifications.

---

## Overview

```
TrainingPeaks → Google Apps Script → Slack Webhook → Your Slack Channel
```

When a client marks a workout as complete in TrainingPeaks, you'll receive a formatted Slack message with:
- Client name
- Workout type (run, strength, etc.)
- Completion time
- Any notes or performance data

---

## Step 1: Create a Slack App with Incoming Webhook

### 1.1 Create the Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Select **"From scratch"**
4. Name it: `Shred Athletics Notifications`
5. Select your workspace
6. Click **"Create App"**

### 1.2 Enable Incoming Webhooks

1. In the left sidebar, click **"Incoming Webhooks"**
2. Toggle **"Activate Incoming Webhooks"** to **On**
3. Click **"Add New Webhook to Workspace"**
4. Select the channel where you want notifications (e.g., `#coaching-alerts` or DM yourself)
5. Click **"Allow"**
6. Copy the **Webhook URL** - it will start with:
   ```
   https://hooks.slack.com/services/TXXXXX/BXXXXX/your-secret-token
   ```

> **Important:** Keep this URL secret! Anyone with it can post to your Slack.

---

## Step 2: Set Up Google Apps Script

Google Apps Script provides a free, serverless way to receive webhooks and forward them to Slack.

### 2.1 Create the Script

1. Go to [Google Apps Script](https://script.google.com/)
2. Click **"New project"**
3. Name it: `Shred Athletics Session Notifications`
4. Delete the default code and paste the following:

```javascript
// ============================================
// SHRED ATHLETICS - SESSION COMPLETION NOTIFICATIONS
// ============================================

// Your Slack webhook URL (from Step 1)
const SLACK_WEBHOOK_URL = 'YOUR_SLACK_WEBHOOK_URL_HERE';

// Your coach name for the notifications
const COACH_NAME = 'Coach';

/**
 * Handles incoming POST requests from TrainingPeaks or manual triggers
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);

    // Extract session information
    const athleteName = data.athleteName || data.athlete_name || 'Unknown Athlete';
    const workoutType = data.workoutType || data.workout_type || 'Workout';
    const workoutTitle = data.workoutTitle || data.workout_title || '';
    const completedAt = data.completedAt || data.completed_at || new Date().toISOString();
    const duration = data.duration || '';
    const distance = data.distance || '';
    const notes = data.notes || data.athleteNotes || '';
    const feeling = data.feeling || data.perceivedExertion || '';

    // Send to Slack
    sendSlackNotification({
      athleteName,
      workoutType,
      workoutTitle,
      completedAt,
      duration,
      distance,
      notes,
      feeling
    });

    // Log for debugging
    logToSheet(data);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error('Error processing webhook:', error);
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Sends a formatted notification to Slack
 */
function sendSlackNotification(session) {
  const completedDate = new Date(session.completedAt);
  const formattedTime = Utilities.formatDate(completedDate, 'America/New_York', 'MMM d, yyyy h:mm a');

  // Build the message blocks for rich formatting
  const blocks = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: '🏃 Session Completed!',
        emoji: true
      }
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Athlete:*\n${session.athleteName}`
        },
        {
          type: 'mrkdwn',
          text: `*Workout:*\n${session.workoutType}${session.workoutTitle ? ' - ' + session.workoutTitle : ''}`
        }
      ]
    },
    {
      type: 'section',
      fields: [
        {
          type: 'mrkdwn',
          text: `*Completed:*\n${formattedTime}`
        },
        {
          type: 'mrkdwn',
          text: `*Duration:*\n${session.duration || 'Not recorded'}`
        }
      ]
    }
  ];

  // Add distance if available
  if (session.distance) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Distance:* ${session.distance}`
      }
    });
  }

  // Add athlete notes if available
  if (session.notes) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Athlete Notes:*\n> ${session.notes}`
      }
    });
  }

  // Add feeling/RPE if available
  if (session.feeling) {
    blocks.push({
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: `Perceived effort: ${session.feeling}/10`
        }
      ]
    });
  }

  // Add divider at the end
  blocks.push({ type: 'divider' });

  const payload = {
    blocks: blocks,
    text: `${session.athleteName} completed ${session.workoutType}` // Fallback text
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload)
  };

  UrlFetchApp.fetch(SLACK_WEBHOOK_URL, options);
}

/**
 * Logs session data to a Google Sheet for record keeping
 */
function logToSheet(data) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) return; // Skip if no spreadsheet is bound

    let sheet = ss.getSheetByName('Session Log');
    if (!sheet) {
      sheet = ss.insertSheet('Session Log');
      sheet.appendRow(['Timestamp', 'Athlete', 'Workout Type', 'Title', 'Duration', 'Distance', 'Notes', 'Raw Data']);
    }

    sheet.appendRow([
      new Date(),
      data.athleteName || data.athlete_name || '',
      data.workoutType || data.workout_type || '',
      data.workoutTitle || data.workout_title || '',
      data.duration || '',
      data.distance || '',
      data.notes || '',
      JSON.stringify(data)
    ]);
  } catch (e) {
    console.log('Sheet logging skipped:', e.message);
  }
}

/**
 * Test function - sends a sample notification to verify setup
 */
function testNotification() {
  sendSlackNotification({
    athleteName: 'Test Athlete',
    workoutType: 'Easy Run',
    workoutTitle: 'Recovery Day',
    completedAt: new Date().toISOString(),
    duration: '45:00',
    distance: '6.2 miles',
    notes: 'Felt great! Legs are recovering nicely.',
    feeling: '4'
  });

  console.log('Test notification sent! Check your Slack channel.');
}

/**
 * Manual trigger - useful for Zapier/Make.com integrations
 */
function doGet(e) {
  return ContentService
    .createTextOutput('Shred Athletics Session Notifications - Webhook Active')
    .setMimeType(ContentService.MimeType.TEXT);
}
```

### 2.2 Configure Your Webhook URL

1. Replace `'YOUR_SLACK_WEBHOOK_URL_HERE'` with the webhook URL from Step 1
2. Optionally update the timezone in the `formattedTime` line

### 2.3 Deploy as Web App

1. Click **"Deploy"** > **"New deployment"**
2. Click the gear icon and select **"Web app"**
3. Configure:
   - **Description:** `Session Notifications v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone`
4. Click **"Deploy"**
5. Click **"Authorize access"** and follow the prompts
6. Copy the **Web app URL** - this is your webhook endpoint

### 2.4 Test the Setup

1. In the Apps Script editor, select `testNotification` from the dropdown
2. Click **"Run"**
3. Check your Slack channel for the test message!

---

## Step 3: Connect TrainingPeaks

TrainingPeaks can be connected via several methods:

### Option A: TrainingPeaks Webhooks (Recommended)

If you have TrainingPeaks API access:

1. Log in to [TrainingPeaks Developer Portal](https://developers.trainingpeaks.com/)
2. Navigate to **Webhooks** settings
3. Add a new webhook:
   - **URL:** Your Google Apps Script Web App URL
   - **Events:** `workout.completed`
4. Save and test

### Option B: Zapier Integration (No-Code)

1. Create a [Zapier](https://zapier.com) account
2. Create a new Zap:
   - **Trigger:** TrainingPeaks → Completed Workout
   - **Action:** Webhooks by Zapier → POST
   - **URL:** Your Google Apps Script Web App URL
   - **Payload Type:** JSON
   - Map the fields:
     ```json
     {
       "athleteName": "{{athlete_name}}",
       "workoutType": "{{workout_type}}",
       "workoutTitle": "{{workout_title}}",
       "completedAt": "{{completed_at}}",
       "duration": "{{duration}}",
       "distance": "{{distance}}",
       "notes": "{{athlete_notes}}"
     }
     ```
3. Turn on your Zap

### Option C: Make.com (Integromat)

Similar to Zapier but with more flexibility:

1. Create a [Make.com](https://make.com) account
2. Create a new scenario:
   - **Module 1:** TrainingPeaks → Watch Completed Workouts
   - **Module 2:** HTTP → Make a request (POST to your webhook URL)
3. Configure and activate

### Option D: Manual Trigger via Strava

If using Strava instead of TrainingPeaks:

1. Connect Strava to Zapier/Make.com
2. Trigger on "New Activity"
3. Send webhook to your Google Apps Script URL

---

## Step 4: Customize Notifications (Optional)

### Change the Message Format

Edit the `sendSlackNotification` function to customize:
- Add/remove fields
- Change emoji
- Modify formatting

### Add Conditional Logic

```javascript
// Example: Different emoji based on workout type
let emoji = '🏃';
if (session.workoutType.toLowerCase().includes('strength')) {
  emoji = '💪';
} else if (session.workoutType.toLowerCase().includes('swim')) {
  emoji = '🏊';
} else if (session.workoutType.toLowerCase().includes('bike') ||
           session.workoutType.toLowerCase().includes('cycling')) {
  emoji = '🚴';
}
```

### Add Celebration Messages

```javascript
// Example: Celebrate long runs
if (parseFloat(session.distance) > 15) {
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '🎉 *Great long run! Recovery is key now!*'
    }
  });
}
```

---

## Troubleshooting

### Notifications not appearing?

1. **Check the Slack webhook URL** - Make sure it's correctly pasted
2. **Run the test function** - Select `testNotification` and click Run
3. **Check execution logs** - In Apps Script, go to Executions to see errors
4. **Verify deployment** - Make sure the web app is deployed and accessible

### Getting errors?

1. **Check the payload format** - The incoming data must be valid JSON
2. **Verify permissions** - The web app needs to be accessible to "Anyone"
3. **Check quotas** - Google Apps Script has daily limits (but very generous)

### Need to update the code?

1. Make your changes
2. Click **Deploy** > **Manage deployments**
3. Click the pencil icon on your deployment
4. Select **"New version"**
5. Click **Deploy**

---

## Example Notification

Here's what you'll see in Slack:

```
┌─────────────────────────────────────────────────┐
│ 🏃 Session Completed!                           │
│                                                 │
│ Athlete:           Workout:                     │
│ Eliel Negrón       Easy Run - Recovery Day      │
│                                                 │
│ Completed:         Duration:                    │
│ Jan 7, 2026 7:30am 45:00                        │
│                                                 │
│ Distance: 6.2 miles                             │
│                                                 │
│ Athlete Notes:                                  │
│ > Felt great! Legs are recovering nicely.       │
│                                                 │
│ Perceived effort: 4/10                          │
│─────────────────────────────────────────────────│
└─────────────────────────────────────────────────┘
```

---

## Quick Reference

| Item | Location |
|------|----------|
| Slack App Dashboard | [api.slack.com/apps](https://api.slack.com/apps) |
| Google Apps Script | [script.google.com](https://script.google.com) |
| TrainingPeaks API | [developers.trainingpeaks.com](https://developers.trainingpeaks.com) |
| Zapier | [zapier.com](https://zapier.com) |
| Make.com | [make.com](https://make.com) |

---

## Need Help?

If you run into issues:
1. Check the troubleshooting section above
2. Review the Apps Script execution logs
3. Test with the `testNotification` function first
