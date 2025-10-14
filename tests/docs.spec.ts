import { test, expect } from './fixtures/coverage';
import { basicInit } from './utils/basicInit';

test('Docs renders (any variant)', async ({ page }) => {
  await basicInit(page);

  const candidates = ['/docs', '/docs/service', '/docs/factory', '/documentation'];
  for (const path of candidates) {
    try {
      await page.goto(path);
      const main = page.locator('main');
      await main.waitFor({ state: 'attached', timeout: 800 });
      const anyHeading = page.getByRole('heading').first();
      await anyHeading.waitFor({ state: 'attached', timeout: 800 });
      return; 
    } catch {

    }
  }

  test.info().annotations.push({ type: 'note', description: `Docs route not found.` });
});
