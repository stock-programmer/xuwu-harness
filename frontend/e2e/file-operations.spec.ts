import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { openProject } from './helpers/project';

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Assuming there's a test project available
    // In a real scenario, you might want to create a test project first
    await page.goto('/dashboard');
  });

  test('should display file explorer', async ({ page }) => {
    // This test assumes a project is open
    // Navigate to a project if needed
    await expect(page.locator('text=文件浏览器')).toBeVisible();
  });

  test('should create a new file', async ({ page }) => {
    // Right-click on directory
    await page.click('[data-testid="file-tree-node"]:has-text("src")', {
      button: 'right',
    });

    // Click new file
    await page.click('text=新建文件');

    // Fill in file name
    await page.fill('input[placeholder="例如: index.ts"]', 'test.ts');
    await page.click('button:has-text("确定")');

    // Verify file was created
    await expect(page.locator('text=test.ts')).toBeVisible();
  });

  test('should rename a file', async ({ page }) => {
    // Right-click on file
    await page.click('[data-testid="file-tree-node"]:has-text("test.ts")', {
      button: 'right',
    });

    // Click rename
    await page.click('text=重命名');

    // Enter new name
    await page.fill('input[value="test.ts"]', 'renamed.ts');
    await page.click('button:has-text("确定")');

    // Verify file was renamed
    await expect(page.locator('text=renamed.ts')).toBeVisible();
  });

  test('should delete a file', async ({ page }) => {
    // Right-click on file
    await page.click('[data-testid="file-tree-node"]:has-text("renamed.ts")', {
      button: 'right',
    });

    // Click delete
    await page.click('text=删除');

    // Confirm deletion
    await page.click('button:has-text("确定")');

    // Verify file was deleted
    await expect(page.locator('text=renamed.ts')).not.toBeVisible();
  });

  test('should create a new folder', async ({ page }) => {
    // Right-click on root directory
    await page.click('[data-testid="file-tree-root"]', {
      button: 'right',
    });

    // Click new folder
    await page.click('text=新建文件夹');

    // Fill in folder name
    await page.fill('input[placeholder="例如: components"]', 'test-folder');
    await page.click('button:has-text("确定")');

    // Verify folder was created
    await expect(page.locator('text=test-folder')).toBeVisible();
  });

  test('should expand and collapse folders', async ({ page }) => {
    // Click on folder to expand
    const folder = page.locator('[data-testid="file-tree-node"]:has-text("src")').first();
    await folder.click();

    // Wait for expansion
    await page.waitForTimeout(300);

    // Verify folder is expanded (children are visible)
    const children = page.locator('[data-testid="file-tree-node"]');
    const count = await children.count();
    expect(count).toBeGreaterThan(1);

    // Click again to collapse
    await folder.click();
    await page.waitForTimeout(300);
  });

  test('should open file in editor', async ({ page }) => {
    // Click on a file
    await page.click('[data-testid="file-tree-node"]:has-text(".ts")').first().click();

    // Verify file is opened in editor
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });
});
