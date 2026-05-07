const { test, expect } = require('@playwright/test');
const path = require('path');

test('game over restart returns to ready state and resets game', async ({ page }) => {
  const filePath = path.resolve(__dirname, '../Index.html');
  const fileUrl = `file://${filePath.replace(/\\/g, '/')}`;

  await page.goto(fileUrl);
  await expect(page.locator('#title-screen')).toBeVisible();

  // Start the game and go to READY state
  await page.click('#game-canvas');
  await expect(page.locator('#ready-screen')).toBeVisible();

  // Simulate a game over state from the page context
  await page.evaluate(() => {
    window.score = 8;
    window.gameOver();
  });

  await expect(page.locator('#game-over-screen')).toBeVisible();
  await expect(page.evaluate(() => window.gameState)).resolves.toBe('GAME_OVER');
  await expect(page.evaluate(() => window.score)).resolves.toBe(8);

  // Restart the game and verify it returns to READY
  await page.click('#restart-btn');
  await expect(page.locator('#ready-screen')).toBeVisible();
  await expect(page.evaluate(() => window.gameState)).resolves.toBe('READY');
  await expect(page.evaluate(() => window.score)).resolves.toBe(0);
});
