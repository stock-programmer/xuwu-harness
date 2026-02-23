import { Page, expect } from '@playwright/test';

/**
 * Create a new project
 */
export async function createProject(
  page: Page,
  config: {
    name: string;
    type: 'fullstack' | 'frontend' | 'backend';
    rootPath: string;
  }
) {
  await page.click('button:has-text("创建项目")');
  await page.waitForSelector('[role="dialog"]');

  await page.fill('input[id="name"]', config.name);
  await page.selectOption('select[id="type"]', config.type);
  await page.fill('input[id="rootPath"]', config.rootPath);

  await page.click('button:has-text("确定")');

  // Wait for dialog to close
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

  // Verify project was created
  await expect(page.locator(`text=${config.name}`)).toBeVisible();
}

/**
 * Open a project
 */
export async function openProject(page: Page, projectName: string) {
  await page.click(`text=${projectName}`);
  await page.click('button:has-text("查看详情")');
  await page.waitForURL(/\/project\//);
}

/**
 * Delete a project
 */
export async function deleteProject(page: Page, projectName: string) {
  // Click the project card's more actions button
  const projectCard = page.locator(`text=${projectName}`).locator('..');
  await projectCard.locator('[data-icon="ellipsis"]').click();

  // Click delete
  await page.click('text=删除');

  // Confirm deletion
  await page.click('button:has-text("删除")');

  // Verify project was deleted
  await expect(page.locator(`text=${projectName}`)).not.toBeVisible();
}
