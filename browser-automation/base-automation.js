/**
 * Base Browser Automation Class
 *
 * Extend this class to create automation for other platforms
 * that don't have APIs (e.g., Strava, Garmin, etc.)
 */

require('dotenv').config();
const { chromium } = require('playwright');

class BaseBrowserAutomation {
  constructor(options = {}) {
    this.browser = null;
    this.context = null;
    this.page = null;
    this.options = {
      headless: process.env.HEADLESS === 'true',
      slowMo: options.slowMo || 0,
      timeout: options.timeout || 60000,
      userAgent: options.userAgent || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      viewport: options.viewport || { width: 1920, height: 1080 },
      ...options,
    };
  }

  async init() {
    console.log('🚀 Launching browser...');
    this.browser = await chromium.launch({
      headless: this.options.headless,
      slowMo: this.options.slowMo,
    });

    this.context = await this.browser.newContext({
      userAgent: this.options.userAgent,
      viewport: this.options.viewport,
    });

    this.page = await this.context.newPage();
    this.page.setDefaultTimeout(this.options.timeout);

    return this;
  }

  async goto(url, options = {}) {
    console.log(`🌐 Navigating to: ${url}`);
    await this.page.goto(url, {
      waitUntil: 'networkidle',
      ...options,
    });
  }

  async waitAndClick(selector, options = {}) {
    await this.page.waitForSelector(selector, options);
    await this.page.click(selector);
  }

  async waitAndFill(selector, value, options = {}) {
    await this.page.waitForSelector(selector, options);
    await this.page.fill(selector, value);
  }

  async trySelectors(selectors, action = 'click', value = null) {
    for (const selector of selectors) {
      try {
        const element = await this.page.$(selector);
        if (element) {
          if (action === 'click') {
            await element.click();
          } else if (action === 'fill' && value) {
            await element.fill(value);
          } else if (action === 'text') {
            return (await element.textContent())?.trim();
          }
          return true;
        }
      } catch (e) {
        continue;
      }
    }
    return false;
  }

  async screenshot(filename) {
    const path = filename.endsWith('.png') ? filename : `${filename}.png`;
    await this.page.screenshot({ path, fullPage: true });
    console.log(`📸 Screenshot saved: ${path}`);
    return path;
  }

  async getPageContent() {
    return await this.page.content();
  }

  async waitForNavigation(options = {}) {
    await this.page.waitForLoadState('networkidle', options);
  }

  async delay(ms) {
    await this.page.waitForTimeout(ms);
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔒 Browser closed');
    }
  }

  // Override these methods in subclasses
  async login() {
    throw new Error('login() must be implemented in subclass');
  }

  async extractData() {
    throw new Error('extractData() must be implemented in subclass');
  }
}

module.exports = { BaseBrowserAutomation };
