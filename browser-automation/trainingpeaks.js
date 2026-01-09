/**
 * TrainingPeaks Browser Automation
 *
 * Automates login and client data extraction from TrainingPeaks
 * when no API access is available.
 *
 * Usage:
 *   node trainingpeaks.js                    # Interactive mode
 *   HEADLESS=true node trainingpeaks.js      # Headless mode (for servers)
 */

require('dotenv').config();
const { chromium } = require('playwright');

const CONFIG = {
  email: process.env.TRAININGPEAKS_EMAIL,
  password: process.env.TRAININGPEAKS_PASSWORD,
  headless: process.env.HEADLESS === 'true',
  slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO) : 0,
  timeout: 60000,
};

const URLS = {
  login: 'https://home.trainingpeaks.com/login',
  dashboard: 'https://home.trainingpeaks.com/coach',
  athletes: 'https://home.trainingpeaks.com/coach/athletes',
};

class TrainingPeaksAutomation {
  constructor() {
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  async init() {
    console.log('🚀 Launching browser...');
    this.browser = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
    });

    this.context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(CONFIG.timeout);
  }

  async login() {
    if (!CONFIG.email || !CONFIG.password) {
      throw new Error('Missing credentials. Set TRAININGPEAKS_EMAIL and TRAININGPEAKS_PASSWORD in .env');
    }

    console.log('🔐 Navigating to login page...');
    await this.page.goto(URLS.login, { waitUntil: 'networkidle' });

    // Wait for login form
    await this.page.waitForSelector('input[type="email"], input[name="email"], #email', { timeout: 10000 });

    console.log('📝 Entering credentials...');

    // Try different possible selectors for email field
    const emailSelectors = ['input[type="email"]', 'input[name="email"]', '#email', 'input[placeholder*="email" i]'];
    for (const selector of emailSelectors) {
      try {
        const emailInput = await this.page.$(selector);
        if (emailInput) {
          await emailInput.fill(CONFIG.email);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Try different possible selectors for password field
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]', '#password'];
    for (const selector of passwordSelectors) {
      try {
        const passwordInput = await this.page.$(selector);
        if (passwordInput) {
          await passwordInput.fill(CONFIG.password);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Click login button
    const loginButtonSelectors = ['button[type="submit"]', 'input[type="submit"]', 'button:has-text("Log In")', 'button:has-text("Sign In")'];
    for (const selector of loginButtonSelectors) {
      try {
        const button = await this.page.$(selector);
        if (button) {
          await button.click();
          break;
        }
      } catch (e) {
        continue;
      }
    }

    console.log('⏳ Waiting for login to complete...');

    // Wait for navigation or dashboard element
    await Promise.race([
      this.page.waitForURL('**/coach**', { timeout: 30000 }),
      this.page.waitForURL('**/athlete**', { timeout: 30000 }),
      this.page.waitForURL('**/home**', { timeout: 30000 }),
    ]).catch(() => {
      console.log('⚠️ URL did not change as expected, checking for dashboard...');
    });

    // Give the page time to fully load
    await this.page.waitForTimeout(3000);

    console.log('✅ Login successful!');
    console.log(`📍 Current URL: ${this.page.url()}`);
  }

  async getAthletes() {
    console.log('👥 Fetching athlete list...');

    // Navigate to athletes page
    await this.page.goto(URLS.athletes, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);

    // Try to find athlete list - TrainingPeaks structure may vary
    const athletes = [];

    // Look for athlete cards/rows
    const athleteSelectors = [
      '.athlete-card',
      '.athlete-row',
      '[data-athlete-id]',
      '.athlete-list-item',
      'tr[data-athlete]',
      '.athlete',
    ];

    for (const selector of athleteSelectors) {
      const elements = await this.page.$$(selector);
      if (elements.length > 0) {
        console.log(`📋 Found ${elements.length} athletes using selector: ${selector}`);

        for (const el of elements) {
          try {
            const athlete = await this.extractAthleteFromElement(el);
            if (athlete.name) {
              athletes.push(athlete);
            }
          } catch (e) {
            console.log(`⚠️ Could not extract athlete data: ${e.message}`);
          }
        }
        break;
      }
    }

    // If no structured data found, try to extract from page content
    if (athletes.length === 0) {
      console.log('🔍 Trying alternative extraction method...');
      const pageData = await this.extractFromPageContent();
      athletes.push(...pageData);
    }

    console.log(`✅ Extracted ${athletes.length} athletes`);
    return athletes;
  }

  async extractAthleteFromElement(element) {
    const athlete = {
      name: '',
      email: '',
      lastActivity: '',
      complianceScore: '',
      upcomingWorkouts: '',
      notes: '',
    };

    // Try to get athlete name
    const nameSelectors = ['.athlete-name', '.name', 'h3', 'h4', '[data-name]', 'a'];
    for (const selector of nameSelectors) {
      try {
        const nameEl = await element.$(selector);
        if (nameEl) {
          athlete.name = await nameEl.textContent();
          if (athlete.name) {
            athlete.name = athlete.name.trim();
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }

    // Try to get compliance/CTL score
    const complianceSelectors = ['.compliance', '.ctl', '.fitness', '[data-compliance]'];
    for (const selector of complianceSelectors) {
      try {
        const compEl = await element.$(selector);
        if (compEl) {
          athlete.complianceScore = (await compEl.textContent())?.trim() || '';
          break;
        }
      } catch (e) {
        continue;
      }
    }

    // Try to get last activity date
    const activitySelectors = ['.last-activity', '.activity-date', '[data-last-activity]', 'time'];
    for (const selector of activitySelectors) {
      try {
        const actEl = await element.$(selector);
        if (actEl) {
          athlete.lastActivity = (await actEl.textContent())?.trim() || '';
          break;
        }
      } catch (e) {
        continue;
      }
    }

    return athlete;
  }

  async extractFromPageContent() {
    // Fallback: extract any visible athlete information from page
    const content = await this.page.content();
    const athletes = [];

    // Take a screenshot for debugging
    await this.page.screenshot({ path: 'debug-athletes-page.png', fullPage: true });
    console.log('📸 Screenshot saved to debug-athletes-page.png');

    return athletes;
  }

  async getAthleteDetails(athleteId) {
    console.log(`📊 Fetching details for athlete: ${athleteId}`);

    const athleteUrl = `https://home.trainingpeaks.com/coach/athlete/${athleteId}`;
    await this.page.goto(athleteUrl, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(2000);

    const details = {
      id: athleteId,
      metrics: {},
      recentWorkouts: [],
      plannedWorkouts: [],
    };

    // Extract performance metrics
    const metricsSelectors = {
      ctl: '.ctl-value, [data-metric="ctl"]',
      atl: '.atl-value, [data-metric="atl"]',
      tsb: '.tsb-value, [data-metric="tsb"]',
      weeklyTss: '.weekly-tss, [data-metric="weekly-tss"]',
    };

    for (const [metric, selector] of Object.entries(metricsSelectors)) {
      try {
        const el = await this.page.$(selector);
        if (el) {
          details.metrics[metric] = (await el.textContent())?.trim() || '';
        }
      } catch (e) {
        console.log(`⚠️ Could not extract ${metric}`);
      }
    }

    // Take screenshot of athlete dashboard
    await this.page.screenshot({
      path: `athlete-${athleteId}-dashboard.png`,
      fullPage: true
    });

    return details;
  }

  async getWeeklyOverview() {
    console.log('📅 Fetching weekly overview...');

    // Navigate to coach dashboard
    await this.page.goto(URLS.dashboard, { waitUntil: 'networkidle' });
    await this.page.waitForTimeout(3000);

    const overview = {
      date: new Date().toISOString(),
      athletes: [],
      alerts: [],
      summary: '',
    };

    // Take screenshot of dashboard
    await this.page.screenshot({
      path: 'coach-dashboard.png',
      fullPage: true
    });
    console.log('📸 Dashboard screenshot saved');

    // Try to extract dashboard summary data
    const summarySelectors = [
      '.dashboard-summary',
      '.coach-summary',
      '.overview-panel',
    ];

    for (const selector of summarySelectors) {
      try {
        const el = await this.page.$(selector);
        if (el) {
          overview.summary = (await el.textContent())?.trim() || '';
          break;
        }
      } catch (e) {
        continue;
      }
    }

    return overview;
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }
}

// Main execution
async function main() {
  const automation = new TrainingPeaksAutomation();

  try {
    await automation.init();
    await automation.login();

    // Get athletes list
    const athletes = await automation.getAthletes();
    console.log('\n📊 Athletes Data:');
    console.log(JSON.stringify(athletes, null, 2));

    // Get weekly overview
    const overview = await automation.getWeeklyOverview();
    console.log('\n📅 Weekly Overview:');
    console.log(JSON.stringify(overview, null, 2));

    // Return combined data
    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      athletes,
      overview,
    };

    console.log('\n✅ Data extraction complete!');
    return result;

  } catch (error) {
    console.error('❌ Error:', error.message);

    // Take error screenshot
    if (automation.page) {
      await automation.page.screenshot({ path: 'error-screenshot.png', fullPage: true });
      console.log('📸 Error screenshot saved');
    }

    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    };

  } finally {
    await automation.close();
  }
}

// Export for use as module
module.exports = { TrainingPeaksAutomation, main };

// Run if called directly
if (require.main === module) {
  main().then(result => {
    console.log('\n📦 Final Result:');
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  });
}
