# Weekly Check-in Alerts: Typeform → n8n → Telegram

This guide sets up automatic notifications to your Telegram group (with Coach Jack) whenever a client submits their weekly check-in form.

---

## Step 1: Create a Telegram Bot (2 minutes)

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `Shred Athletics Alerts`
4. Choose a username: `shredathletics_bot` (must end in `bot`)
5. **Save the API token** you receive - looks like: `7123456789:AAHxxxxxxxxxxxxxxxxxxxxxx`

---

## Step 2: Create Group & Get Chat ID (3 minutes)

1. Create a new Telegram group with you and Coach Jack
2. Name it something like "Shred - Client Check-ins"
3. **Add your bot** to the group (search for @shredathletics_bot)
4. Send any message in the group (e.g., "test")
5. Open this URL in your browser (replace YOUR_BOT_TOKEN):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
6. Look for `"chat":{"id":-XXXXXXXXXX}` - that negative number is your **Group Chat ID**

---

## Step 3: Import n8n Workflow

1. Open your n8n instance
2. Create a new workflow
3. Click the three dots menu → **Import from URL** or paste the JSON below
4. Update the credentials (Telegram bot token)

### n8n Workflow JSON

Copy this entire JSON and import into n8n:

```json
{
  "name": "Typeform Weekly Check-in → Telegram",
  "nodes": [
    {
      "parameters": {
        "httpMethod": "POST",
        "path": "typeform-checkin",
        "responseMode": "onReceived",
        "responseData": "allEntries"
      },
      "id": "webhook-node",
      "name": "Typeform Webhook",
      "type": "n8n-nodes-base.webhook",
      "typeVersion": 1.1,
      "position": [250, 300],
      "webhookId": "typeform-checkin"
    },
    {
      "parameters": {
        "jsCode": "// Extract form answers from Typeform webhook payload\nconst data = $input.first().json;\n\n// Typeform sends answers in form_response.answers array\nconst answers = data.form_response?.answers || [];\nconst definition = data.form_response?.definition?.fields || [];\n\n// Helper to get answer by field title (partial match)\nfunction getAnswer(titleContains) {\n  const field = definition.find(f => \n    f.title?.toLowerCase().includes(titleContains.toLowerCase())\n  );\n  if (!field) return 'N/A';\n  \n  const answer = answers.find(a => a.field?.id === field.id);\n  if (!answer) return 'N/A';\n  \n  // Handle different answer types\n  if (answer.type === 'text') return answer.text || 'N/A';\n  if (answer.type === 'number') return answer.number?.toString() || 'N/A';\n  if (answer.type === 'boolean') return answer.boolean ? 'Yes' : 'No';\n  if (answer.type === 'choice') return answer.choice?.label || 'N/A';\n  if (answer.type === 'choices') return answer.choices?.labels?.join(', ') || 'N/A';\n  \n  return 'N/A';\n}\n\n// Build the message\nconst name = getAnswer('name');\nconst currentWeight = getAnswer('current weight');\nconst targetWeight = getAnswer('target weight');\nconst nutritionScore = getAnswer('nutrition adherence') || getAnswer('nutrition') && getAnswer('1-10');\nconst nutritionThoughts = getAnswer('nutrition thoughts') || getAnswer('nutrition changes');\nconst runningVolume = getAnswer('running volume') || getAnswer('total') && getAnswer('km');\nconst completedRuns = getAnswer('complete all planned') || getAnswer('planned runs');\nconst missedReason = getAnswer('missing runs') || getAnswer('reason');\nconst strengthScore = getAnswer('strength training');\nconst fatigueLevel = getAnswer('fatigue');\nconst injuries = getAnswer('pain') || getAnswer('niggles') || getAnswer('injuries');\nconst fueling = getAnswer('fueling');\nconst bestSession = getAnswer('best session');\nconst focusAreas = getAnswer('focus areas') || getAnswer('weekly focus');\nconst travel = getAnswer('travel') || getAnswer('schedule conflicts');\nconst supportNeeded = getAnswer('support needed') || getAnswer('support');\n\n// Format Telegram message\nconst message = `📋 *WEEKLY CHECK-IN*\n━━━━━━━━━━━━━━━━━━\n\n👤 *${name}*\n\n⚖️ *Weight*\nCurrent: ${currentWeight} | Target: ${targetWeight}\n\n🍎 *Nutrition*\nAdherence: ${nutritionScore}/10\n${nutritionThoughts !== 'N/A' ? `Notes: ${nutritionThoughts}` : ''}\n\n🏃 *Running*\nVolume: ${runningVolume} km\nCompleted all runs: ${completedRuns}\n${missedReason !== 'N/A' ? `Missed because: ${missedReason}` : ''}\n\n💪 *Strength Training*: ${strengthScore}/10\n\n😴 *Fatigue Level*: ${fatigueLevel}/10\n\n🩹 *Injuries/Niggles*\n${injuries !== 'N/A' ? injuries : 'None reported'}\n\n⛽ *Long Run Fueling*: ${fueling}\n\n🌟 *Best Session*\n${bestSession !== 'N/A' ? bestSession : 'Not specified'}\n\n🎯 *Focus Areas*\n${focusAreas !== 'N/A' ? focusAreas : 'Not specified'}\n\n✈️ *Upcoming Travel/Conflicts*\n${travel !== 'N/A' ? travel : 'None'}\n\n🆘 *Support Needed*\n${supportNeeded !== 'N/A' ? supportNeeded : 'None requested'}\n\n━━━━━━━━━━━━━━━━━━`;\n\nreturn [{ json: { message, clientName: name } }];"
      },
      "id": "format-message",
      "name": "Format Message",
      "type": "n8n-nodes-base.code",
      "typeVersion": 2,
      "position": [480, 300]
    },
    {
      "parameters": {
        "chatId": "YOUR_GROUP_CHAT_ID",
        "text": "={{ $json.message }}",
        "additionalFields": {
          "parse_mode": "Markdown"
        }
      },
      "id": "telegram-send",
      "name": "Send to Telegram",
      "type": "n8n-nodes-base.telegram",
      "typeVersion": 1.1,
      "position": [710, 300],
      "credentials": {
        "telegramApi": {
          "id": "1",
          "name": "Telegram Bot"
        }
      }
    }
  ],
  "connections": {
    "Typeform Webhook": {
      "main": [
        [
          {
            "node": "Format Message",
            "type": "main",
            "index": 0
          }
        ]
      ]
    },
    "Format Message": {
      "main": [
        [
          {
            "node": "Send to Telegram",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  },
  "settings": {
    "executionOrder": "v1"
  },
  "staticData": null,
  "tags": []
}
```

---

## Step 4: Configure n8n

### 4.1 Add Telegram Credentials
1. In n8n, go to **Credentials** → **Add Credential**
2. Search for **Telegram API**
3. Paste your bot token from Step 1
4. Save

### 4.2 Update the Workflow
1. Click on the **"Send to Telegram"** node
2. Replace `YOUR_GROUP_CHAT_ID` with your actual group chat ID (from Step 2)
3. Select your Telegram credential
4. **Save** the workflow
5. Toggle the workflow to **Active**

### 4.3 Get Your Webhook URL
1. Click on the **"Typeform Webhook"** node
2. Copy the **Production URL** (looks like: `https://your-n8n.com/webhook/typeform-checkin`)

---

## Step 5: Connect Typeform

1. Go to your Typeform form: https://ict2fab5vkn.typeform.com/to/nq9kJLsn
2. Click **Connect** → **Webhooks**
3. Click **Add a webhook**
4. Paste your n8n webhook URL
5. Click **Save webhook**

---

## Test It!

1. Submit a test entry on your Typeform
2. Check your Telegram group - you should see the formatted check-in!

---

## Sample Message Output

```
📋 WEEKLY CHECK-IN
━━━━━━━━━━━━━━━━━━

👤 Faisal Alateeq

⚖️ Weight
Current: 65kg | Target: 63kg

🍎 Nutrition
Adherence: 8/10
Notes: Struggled on weekend but back on track

🏃 Running
Volume: 45 km
Completed all runs: Yes

💪 Strength Training: 7/10

😴 Fatigue Level: 4/10

🩹 Injuries/Niggles
None reported

⛽ Long Run Fueling: Mostly good

🌟 Best Session
Tuesday tempo - felt amazing!

🎯 Focus Areas
Consistent pacing on easy runs

✈️ Upcoming Travel/Conflicts
None

🆘 Support Needed
None requested

━━━━━━━━━━━━━━━━━━
```

---

## Troubleshooting

**Bot not sending messages?**
- Make sure the bot is added to the group
- Check the chat ID is correct (should be negative for groups)
- Verify the bot token is correct

**Webhook not triggering?**
- Ensure the n8n workflow is set to Active
- Check Typeform webhook settings show "Delivered"
- Look at n8n executions for errors

**Message formatting broken?**
- Check the field names in your Typeform match the code
- Test with n8n's manual execution feature

---

## Optional: Add Cron Summary (Daily Digest)

If you want a daily summary instead of instant notifications, you can add a second workflow that:
1. Runs on a cron schedule (e.g., 8am daily)
2. Fetches recent Typeform responses via API
3. Sends a batched summary

Let me know if you'd like this alternative!
