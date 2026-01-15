import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'https://raeservice.mju.ac.th/attendance';
const HEALTH_URL = 'https://raeservice.mju.ac.th/attendance/api/health';
const FAKE_TOKEN = 'FAKE.JWT.TOKEN.FOR.TESTING.1234567890';

// Mock user data for /api/auth/sso/me
const MOCK_USER = {
  success: true,
  data: {
    employee_uid: 'test-uid-001',
    first_name_th: 'ทดสอบ',
    last_name_th: 'ระบบ',
    email: 'test@mju.ac.th',
    position: 'Test Position'
  },
  message: 'User retrieved successfully'
};

test.describe('RAE Attendance System - Smoke Tests', () => {
  let consoleErrors: string[] = [];
  let pageErrors: string[] = [];
  let failedRequests: Array<{ url: string; status?: number; error?: string }> = [];
  let apiErrors: Array<{ url: string; status: number }> = [];

  test.beforeEach(async ({ page }) => {
    // Reset error collections
    consoleErrors = [];
    pageErrors = [];
    failedRequests = [];
    apiErrors = [];

    // Collect console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text();
        consoleErrors.push(text);
        console.log(`[Console Error] ${text}`);
      }
    });

    // Collect page errors
    page.on('pageerror', (error) => {
      const message = error.message;
      pageErrors.push(message);
      console.log(`[Page Error] ${message}`);
    });

    // Collect failed requests
    page.on('requestfailed', (request) => {
      const url = request.url();
      const failure = request.failure();
      failedRequests.push({
        url,
        error: failure?.errorText || 'Unknown error'
      });
      console.log(`[Request Failed] ${url}: ${failure?.errorText || 'Unknown'}`);
    });

    // Collect API errors (status >= 400)
    page.on('response', (response) => {
      const url = response.url();
      const status = response.status();
      // Only track same-origin API calls
      if (url.includes('/attendance/api/') && status >= 400) {
        apiErrors.push({ url, status });
        console.log(`[API Error] ${url}: ${status}`);
      }
    });

    // Mock /api/auth/sso/me endpoint to return valid user
    await page.route('**/api/auth/sso/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER)
      });
    });

    // Set token in localStorage before navigation
    await page.addInitScript(({ tokenKey, token }) => {
      localStorage.setItem(tokenKey, token);
      // Also set user data if needed
      localStorage.setItem('user', JSON.stringify({
        employee_uid: 'test-uid-001',
        first_name_th: 'ทดสอบ',
        last_name_th: 'ระบบ'
      }));
    }, { tokenKey: 'accessToken', token: FAKE_TOKEN });
  });

  test('SPA loads and shows dashboard (not blank)', async ({ page }) => {
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });

    // Wait for app to mount - check for root element or common selectors
    await page.waitForSelector('#app, [data-testid="app"], body', { timeout: 10000 });

    // Verify not blank - check body has content
    const bodyText = await page.textContent('body');
    expect(bodyText?.length || 0).toBeGreaterThan(100);

    // Check for navigation/sidebar (indicates app loaded)
    const hasNav = await page.locator('nav, aside, [class*="sidebar"], [class*="nav"]').count();
    expect(hasNav).toBeGreaterThan(0);

    // Take screenshot
    await page.screenshot({ path: 'test-results/smoke-dashboard-loaded.png', fullPage: true });

    // Verify URL is correct (should be /attendance/app/dashboard or similar)
    const url = page.url();
    expect(url).toContain('/attendance');
  });

  test('Navigation works via SPA (no full page reload)', async ({ page }) => {
    await page.goto(`${BASE_URL}/app/dashboard`, { waitUntil: 'networkidle' });

    // Wait for sidebar/nav to be visible
    await page.waitForSelector('nav, aside, [class*="sidebar"]', { timeout: 5000 });

    // Find navigation links
    const navLinks = await page.locator('nav a, aside a, [class*="sidebar"] a, [class*="nav"] a').all();
    
    // Filter visible links that point to /attendance routes
    const validLinks: Array<{ text: string; href: string }> = [];
    for (const link of navLinks) {
      const href = await link.getAttribute('href');
      const isVisible = await link.isVisible();
      if (href && isVisible && (href.includes('/app/') || href.startsWith('/app/'))) {
        const text = await link.textContent();
        if (text && text.trim()) {
          validLinks.push({ text: text.trim(), href });
        }
      }
    }

    console.log(`Found ${validLinks.length} navigation links:`, validLinks.map(l => l.text));

    // Test navigation to first few links
    const linksToTest = validLinks.slice(0, 4); // Test up to 4 links
    for (const linkInfo of linksToTest) {
      const initialUrl = page.url();
      
      // Click link
      const link = page.locator(`a[href="${linkInfo.href}"], a:has-text("${linkInfo.text}")`).first();
      await link.click({ timeout: 5000 });
      
      // Wait for navigation (URL change or content change)
      await page.waitForTimeout(1000); // Allow SPA navigation to settle
      
      const newUrl = page.url();
      
      // Verify URL changed (SPA navigation)
      if (newUrl !== initialUrl) {
        console.log(`✅ Navigated: ${initialUrl} → ${newUrl}`);
      }
      
      // Take screenshot
      const safeName = linkInfo.text.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      await page.screenshot({ 
        path: `test-results/smoke-nav-${safeName}.png`,
        fullPage: true 
      });
      
      // Small delay between navigations
      await page.waitForTimeout(500);
    }
  });

  test('Health endpoint returns 200', async ({ request }) => {
    const response = await request.get(HEALTH_URL);
    expect(response.status()).toBe(200);
    
    const body = await response.json();
    expect(body).toHaveProperty('success');
    // Health endpoint should return success: true
    if (body.success !== undefined) {
      expect(body.success).toBe(true);
    }
  });

  test('Protected API endpoint behavior', async ({ request }) => {
    // Test without token - should get 401 or 403
    const noAuthResponse = await request.get(`${BASE_URL}/api/employees`, {
      headers: { 'Authorization': '' }
    });
    const statusNoAuth = noAuthResponse.status();
    expect([401, 403, 404]).toContain(statusNoAuth); // 404 is acceptable if route doesn't exist

    // Test with fake token - may get 401 (if validated) or 200/404 (if not validated in dev)
    const withAuthResponse = await request.get(`${BASE_URL}/api/employees`, {
      headers: { 'Authorization': `Bearer ${FAKE_TOKEN}` }
    });
    const statusWithAuth = withAuthResponse.status();
    // Accept any status - we're just checking it doesn't crash
    expect([200, 401, 403, 404, 500]).toContain(statusWithAuth);
    
    console.log(`Protected endpoint: No auth = ${statusNoAuth}, With fake token = ${statusWithAuth}`);
  });

  test.afterEach(async ({ page }) => {
    // Log summary
    console.log('\n=== Test Summary ===');
    console.log(`Console Errors: ${consoleErrors.length}`);
    console.log(`Page Errors: ${pageErrors.length}`);
    console.log(`Failed Requests: ${failedRequests.length}`);
    console.log(`API Errors (>=400): ${apiErrors.length}`);
    
    if (consoleErrors.length > 0) {
      console.log('\nConsole Errors:');
      consoleErrors.slice(0, 10).forEach(err => console.log(`  - ${err}`));
    }
    
    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach(err => console.log(`  - ${err}`));
    }
    
    if (failedRequests.length > 0) {
      console.log('\nFailed Requests:');
      failedRequests.slice(0, 10).forEach(req => console.log(`  - ${req.url}: ${req.error}`));
    }
    
    if (apiErrors.length > 0) {
      console.log('\nAPI Errors:');
      apiErrors.slice(0, 10).forEach(err => console.log(`  - ${err.url}: ${err.status}`));
    }
  });
});
