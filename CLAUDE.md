# Coaching Project - Claude Context

## n8n Automation Server

- **URL**: https://n8n.srv1254680.hstgr.cloud
- **Workflows**: https://n8n.srv1254680.hstgr.cloud/home/workflows
- **Hosting**: Hostinger VPS (self-hosted)

When working with n8n workflows, always deploy to this instance.

## Project Overview

This is a coaching platform for running/endurance athletes with:
- Marketing website (GitHub Pages)
- n8n workflow automation
- Telegram notifications for leads and check-ins
- Personalized nutrition plans (markdown files)

## Key Integrations

| Service | Purpose |
|---------|---------|
| n8n | Workflow automation |
| Telegram | Coach notifications |
| Typeform | Lead capture & check-ins |
| TrainingPeaks | Client training data (browser automation) |

## Browser Automation

Located in `browser-automation/` - uses Playwright for logging into platforms without APIs (like TrainingPeaks).

Run the server for n8n integration:
```bash
cd browser-automation && npm run server
```
