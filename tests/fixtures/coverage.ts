import { test as base } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    await use(page);
    const cov = await page.evaluate(() => (window as any).__coverage__);
    if (cov) {
      await fs.mkdir('.nyc_output', { recursive: true });
      const fname = `coverage-${testInfo.workerIndex}-${testInfo.testId.replace(/[^a-z0-9-_]/gi, '_')}.json`;
      await fs.writeFile(path.join('.nyc_output', fname), JSON.stringify(cov));
    }
  },
});
export const expect = test.expect;
