/**
 * Browser Automation HTTP Server for n8n Integration
 *
 * Provides HTTP endpoints that n8n can call to trigger browser automation tasks.
 *
 * Endpoints:
 *   POST /trainingpeaks/athletes  - Get list of athletes
 *   POST /trainingpeaks/overview  - Get coach dashboard overview
 *   POST /trainingpeaks/athlete/:id - Get specific athlete details
 *   GET  /health                   - Health check
 *
 * Usage:
 *   node server.js
 *
 * In n8n, use an HTTP Request node to call these endpoints.
 */

require('dotenv').config();
const express = require('express');
const { TrainingPeaksAutomation } = require('./trainingpeaks');

const app = express();
app.use(express.json());

const PORT = process.env.SERVER_PORT || 3001;

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'browser-automation',
    timestamp: new Date().toISOString(),
  });
});

// Get TrainingPeaks athletes
app.post('/trainingpeaks/athletes', async (req, res) => {
  console.log('📥 Request: Get athletes');

  const automation = new TrainingPeaksAutomation();

  try {
    await automation.init();
    await automation.login();
    const athletes = await automation.getAthletes();

    res.json({
      success: true,
      data: athletes,
      count: athletes.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

  } finally {
    await automation.close();
  }
});

// Get TrainingPeaks coach dashboard overview
app.post('/trainingpeaks/overview', async (req, res) => {
  console.log('📥 Request: Get overview');

  const automation = new TrainingPeaksAutomation();

  try {
    await automation.init();
    await automation.login();
    const overview = await automation.getWeeklyOverview();

    res.json({
      success: true,
      data: overview,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

  } finally {
    await automation.close();
  }
});

// Get specific athlete details
app.post('/trainingpeaks/athlete/:id', async (req, res) => {
  const athleteId = req.params.id;
  console.log(`📥 Request: Get athlete ${athleteId}`);

  const automation = new TrainingPeaksAutomation();

  try {
    await automation.init();
    await automation.login();
    const details = await automation.getAthleteDetails(athleteId);

    res.json({
      success: true,
      data: details,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

  } finally {
    await automation.close();
  }
});

// Full data extraction (athletes + overview)
app.post('/trainingpeaks/full', async (req, res) => {
  console.log('📥 Request: Full data extraction');

  const automation = new TrainingPeaksAutomation();

  try {
    await automation.init();
    await automation.login();

    const athletes = await automation.getAthletes();
    const overview = await automation.getWeeklyOverview();

    res.json({
      success: true,
      data: {
        athletes,
        overview,
      },
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });

  } finally {
    await automation.close();
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
🚀 Browser Automation Server running!

📡 Endpoints:
   POST http://localhost:${PORT}/trainingpeaks/athletes
   POST http://localhost:${PORT}/trainingpeaks/overview
   POST http://localhost:${PORT}/trainingpeaks/athlete/:id
   POST http://localhost:${PORT}/trainingpeaks/full
   GET  http://localhost:${PORT}/health

🔧 Use these endpoints in your n8n HTTP Request nodes.
  `);
});
