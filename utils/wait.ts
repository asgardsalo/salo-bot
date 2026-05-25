import { Page } from 'playwright';

export async function waitForSelectorSafe(
  page: Page,
  selector: string,
  timeout = 10000
) {
  try {
    await page.waitForSelector(selector, { timeout });
  } catch {
    throw new Error(`Timeout waiting for selector: ${selector}`);
  }
}
