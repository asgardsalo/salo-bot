import { chromium, Page } from 'playwright';
import { getSecret } from '../utils/secrets';
import { getMfaTokenFromMailbox } from '../utils/mfa';
import { waitForSelectorSafe } from '../utils/wait';

export async function runTest1() {
  console.log('=== Test 1: START ===');

  // 1. Load secrets securely
  const username = await getSecret('projects/PROJECT_ID/secrets/portal-username/versions/latest');
  const password = await getSecret('projects/PROJECT_ID/secrets/portal-password/versions/latest');

  // 2. Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 3. Health check
    console.log('Checking portal health...');
    const health = await page.goto('https://salolara.mycompany.com');
    if (!health || health.status() !== 200) {
      throw new Error('Portal health check failed');
    }

    // 4. Login
    console.log('Logging in...');
    await page.fill('#username', username);
    await page.fill('#password', password);
    await page.click('#login-button');

    await waitForSelectorSafe(page, '#mfa-input', 15000);

    // 5. MFA
    console.log('Retrieving MFA token...');
    const mfaToken = await getMfaTokenFromMailbox(username);
    await page.fill('#mfa-input', mfaToken);
    await page.click('#mfa-submit');

    await waitForSelectorSafe(page, '#dashboard', 15000);
    console.log('Login + MFA successful');

    // 6. Create dummy app
    const appName = `app.v1.${Date.now()}.test.dev.scl`;
    console.log(`Creating dummy app: ${appName}`);

    await page.click('#create-app');
    await page.fill('#app-name', appName);
    await page.click('#save-app');

    await waitForSelectorSafe(page, `text=${appName}`, 15000);

    // 7. Promote to QA
    console.log('Promoting to QA...');
    await page.click(`#promote-${appName}`);
    await page.click('#promote-to-qa');
    await waitForSelectorSafe(page, '#status-qa', 20000);

    // 8. Promote to LOAD
    console.log('Promoting to LOAD...');
    await page.click('#promote-to-load');
    await waitForSelectorSafe(page, '#status-load', 20000);

    // 9. Deactivate + Delete
    console.log('Deactivating app...');
    await page.click('#deactivate-app');
    await waitForSelectorSafe(page, '#status-inactive', 15000);

    console.log('Deleting app...');
    await page.click('#delete-app');
    await waitForSelectorSafe(page, '#app-deleted', 15000);

    console.log('=== Test 1: SUCCESS ===');
  } catch (err) {
    console.error('Test 1 FAILED:', err);
    await page.screenshot({ path: `error-${Date.now()}.png` });
    throw err;
  } finally {
    await browser.close();
  }
}
