# Browser Automation for Coaching Platforms

Automate login and data extraction from coaching platforms (like TrainingPeaks) that don't provide API access for n8n integration.

## Overview

This solution uses **Playwright** (browser automation) to:
1. Log into TrainingPeaks with your credentials
2. Navigate to your coach dashboard
3. Extract athlete/client data
4. Return structured JSON data that n8n can process

## Quick Start

### 1. Install Dependencies

```bash
cd browser-automation
npm install
npm run install-browsers  # Downloads Chromium
```

### 2. Configure Credentials

```bash
# Copy example env file
cp .env.example .env

# Edit with your credentials
nano .env
```

Set your TrainingPeaks credentials:
```
TRAININGPEAKS_EMAIL=your-email@example.com
TRAININGPEAKS_PASSWORD=your-password
HEADLESS=true
```

### 3. Test the Automation

```bash
# Run in visible browser mode (for testing)
HEADLESS=false npm run trainingpeaks

# Run headless (for production)
npm run trainingpeaks:headless
```

## n8n Integration

### Option A: HTTP Server (Recommended)

Run the automation server that n8n can call via HTTP requests:

```bash
npm run server
```

This starts a server at `http://localhost:3001` with these endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/trainingpeaks/athletes` | POST | Get list of all athletes |
| `/trainingpeaks/overview` | POST | Get coach dashboard overview |
| `/trainingpeaks/athlete/:id` | POST | Get specific athlete details |
| `/trainingpeaks/full` | POST | Get all data (athletes + overview) |
| `/health` | GET | Health check |

#### n8n Workflow Setup

1. **Add HTTP Request Node**:
   - Method: `POST`
   - URL: `http://localhost:3001/trainingpeaks/athletes`
   - Authentication: None (server runs locally)

2. **Connect to your workflow**:
   - Trigger: Schedule (e.g., daily at 6am)
   - HTTP Request → Format data → Send to Telegram/Google Sheets

Example n8n workflow JSON:
```json
{
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "field": "hours", "hoursInterval": 24 }]
        }
      }
    },
    {
      "name": "Get Athletes",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "http://localhost:3001/trainingpeaks/athletes"
      }
    }
  ]
}
```

### Option B: Direct Execution via n8n Execute Command

If you prefer not to run a separate server, use n8n's Execute Command node:

1. **Add Execute Command Node**:
   ```
   cd /path/to/coaching/browser-automation && npm run trainingpeaks:headless
   ```

2. **Parse JSON Output**:
   - Add a "Code" node to parse the JSON from stdout

## Running on a Server

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start the server
pm2 start server.js --name browser-automation

# Auto-restart on reboot
pm2 startup
pm2 save
```

### Using Docker

Create a `Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["npm", "run", "server"]
```

```bash
docker build -t browser-automation .
docker run -d -p 3001:3001 --env-file .env browser-automation
```

## Security Considerations

1. **Never commit `.env` file** - It contains your credentials
2. **Run on trusted infrastructure** - The server has no authentication
3. **Consider adding API key auth** for production use
4. **Use environment variables** in production, not .env files

### Adding API Key Authentication

Edit `server.js` to add:

```javascript
const API_KEY = process.env.API_KEY;

app.use((req, res, next) => {
  if (req.headers['x-api-key'] !== API_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
});
```

Then in n8n, add header: `X-API-Key: your-secret-key`

## Extending for Other Platforms

The `base-automation.js` class can be extended for other platforms:

```javascript
const { BaseBrowserAutomation } = require('./base-automation');

class StravaAutomation extends BaseBrowserAutomation {
  async login() {
    await this.goto('https://www.strava.com/login');
    await this.waitAndFill('#email', process.env.STRAVA_EMAIL);
    await this.waitAndFill('#password', process.env.STRAVA_PASSWORD);
    await this.waitAndClick('#login-button');
    await this.waitForNavigation();
  }

  async extractData() {
    // Your extraction logic
  }
}
```

## Troubleshooting

### Login Fails
- Check credentials in `.env`
- Run with `HEADLESS=false` to see what's happening
- TrainingPeaks may have CAPTCHA - you may need to handle this manually first

### Screenshots
The automation saves debug screenshots:
- `debug-athletes-page.png` - Athletes page
- `coach-dashboard.png` - Dashboard
- `error-screenshot.png` - On errors

### Timeouts
Increase timeout in the script:
```javascript
this.page.setDefaultTimeout(120000); // 2 minutes
```

### Browser Not Found
```bash
npm run install-browsers
```

## Output Format

### Athletes Response
```json
{
  "success": true,
  "data": [
    {
      "name": "John Doe",
      "email": "john@example.com",
      "lastActivity": "2024-01-15",
      "complianceScore": "85%"
    }
  ],
  "count": 1,
  "timestamp": "2024-01-16T10:30:00.000Z"
}
```

### Overview Response
```json
{
  "success": true,
  "data": {
    "date": "2024-01-16T10:30:00.000Z",
    "athletes": [],
    "alerts": [],
    "summary": "Dashboard summary text..."
  },
  "timestamp": "2024-01-16T10:30:00.000Z"
}
```

## Files

| File | Purpose |
|------|---------|
| `trainingpeaks.js` | TrainingPeaks automation script |
| `server.js` | HTTP server for n8n integration |
| `base-automation.js` | Base class for extending to other platforms |
| `.env.example` | Example environment configuration |
| `package.json` | Node.js dependencies |
