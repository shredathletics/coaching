# n8n Workflow Automation

## Server Details

- **n8n Instance URL**: https://n8n.srv1254680.hstgr.cloud
- **Workflows Dashboard**: https://n8n.srv1254680.hstgr.cloud/home/workflows
- **Hosting**: Hostinger VPS (self-hosted)

## When Working with n8n

When the user mentions n8n, workflow automation, or wants to deploy/create workflows:

1. **Access the n8n instance** at the URL above
2. **Create workflows** that can be imported via the n8n UI
3. **Generate webhook URLs** using the format: `https://n8n.srv1254680.hstgr.cloud/webhook/[webhook-id]`

## Deployment Instructions

To deploy a workflow to this n8n instance:

1. Generate the workflow JSON file
2. Instruct user to:
   - Go to https://n8n.srv1254680.hstgr.cloud/home/workflows
   - Click "Add Workflow" → "Import from File"
   - Upload the JSON file
   - Configure any credentials (Telegram, etc.)
   - Activate the workflow

## Existing Integrations

This coaching business uses n8n for:
- **Typeform → Telegram**: New lead notifications
- **Weekly Workout Builder**: Automated workout suggestions
- **Weekly Check-ins**: Client progress tracking

## Browser Automation Integration

The browser automation server (when running) can be called from n8n:
- Endpoint: `http://localhost:3001` (if on same server)
- Or use the server's public IP if running elsewhere

## Credentials Typically Needed

- Telegram Bot API (for notifications)
- Typeform (for webhooks)
- Google Sheets (optional)
