import { chromium } from 'playwright';
import { getSecret } from '../utils/secrets';
import { getMfaTokenFromMailbox } from '../utils/mfa';
import { waitForSelectorSafe } from '../utils/wait';
import { runTest1 } from './runTest1';

export async function runTest2() {
  console.log('=== Test 2: START ===');

  const adminUser = await getSecret('projects/PROJECT_ID/secrets/admin-username/versions/latest');
  const adminPass = await getSecret('projects/PROJECT_ID/secrets/admin-password/versions/latest');

  const dummyUser = 'dummy.user.test@mycompany.com';
  const dummyPass = await getSecret('projects/PROJECT_ID/secrets/dummy-password/versions/latest');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. Login as admin
    console.log('Logging in as admin...');
    await page.goto('https://salolara.mycompany.com/login');

    await page.fill('#username', adminUser);
    await page.fill('#password', adminPass);
    await page.click('#login-button');

    await waitForSelectorSafe(page, '#mfa-input', 15000);

    const adminMfa = await getMfaTokenFromMailbox(adminUser);
    await page.fill('#mfa-input', adminMfa);
    await page.click('#mfa-submit');

    await waitForSelectorSafe(page, '#dashboard', 15000);
    console.log('Admin login successful');

    // 2. Create dummy user
    console.log(`Creating dummy user: ${dummyUser}`);

    await page.click('#menu-users');
    await page.click('#create-user');

    await page.fill('#new-user-email', dummyUser);
    await page.fill('#new-user-password', dummyPass);
    await page.selectOption('#new-user-role', 'developer');
    await page.click('#save-user');

    await waitForSelectorSafe(page, `text=${dummyUser}`, 15000);
    console.log('Dummy user created');

    // 3. Logout admin
    await page.click('#logout');

    // 4. Run Test 1 using dummy user
    console.log('Running Test 1 with dummy user...');
    process.env.TEST_USERNAME = dummyUser;
    process.env.TEST_PASSWORD = dummyPass;

    await runTest1();

    // 5. Login again as admin to delete dummy user
    console.log('Cleaning up dummy user...');
    await page.goto('https://salolara.mycompany.com/login');

    await page.fill('#username', adminUser);
    await page.fill('#password', adminPass);
    await page.click('#login-button');

    await waitForSelectorSafe(page, '#mfa-input', 15000);

    const adminMfa2 = await getMfaTokenFromMailbox(adminUser);
    await page.fill('#mfa-input', adminMfa2);
    await page.click('#mfa-submit');

    await waitForSelectorSafe(page, '#dashboard', 15000);

    await page.click('#menu-users');
    await page.click(`#delete-${dummyUser}`);
    await page.click('#confirm-delete');

    await waitForSelectorSafe(page, '#user-deleted', 15000);

    console.log('Dummy user deleted');
    console.log('=== Test 2: SUCCESS ===');

  } catch (err) {
    console.error('Test 2 FAILED:', err);
    await page.screenshot({ path: `error-test2-${Date.now()}.png` });
    throw err;
  } finally {
    await browser.close();
  }
}
