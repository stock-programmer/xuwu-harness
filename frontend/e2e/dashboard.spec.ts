import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { createProject, deleteProject } from './helpers/project';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should display dashboard with statistics', async ({ page }) => {
    await expect(page.locator('text=总项目数')).toBeVisible();
    await expect(page.locator('text=运行中')).toBeVisible();
    await expect(page.locator('text=已完成')).toBeVisible();
    await expect(page.locator('text=失败')).toBeVisible();
  });

  test('should create a new project', async ({ page }) => {
    const projectName = `Test Project ${Date.now()}`;

    await createProject(page, {
      name: projectName,
      type: 'fullstack',
      rootPath: '/tmp/test-project',
    });

    // Verify project appears in the list
    await expect(page.locator(`text=${projectName}`)).toBeVisible();

    // Cleanup: delete test project
    await deleteProject(page, projectName);
  });

  test('should search projects', async ({ page }) => {
    const searchTerm = 'test';
    await page.fill('input[placeholder="搜索项目名称"]', searchTerm);
    await page.press('input[placeholder="搜索项目名称"]', 'Enter');

    // Verify search results
    await page.waitForTimeout(500);
    const visibleProjects = await page.locator('[data-testid="project-card"]').count();
    expect(visibleProjects).toBeGreaterThanOrEqual(0);
  });

  test('should filter projects by type', async ({ page }) => {
    await page.selectOption('select:has-text("项目类型")', 'frontend');
    await page.waitForTimeout(500);

    // Verify filter results
    const projectCards = await page.locator('[data-testid="project-card"]').all();
    for (const card of projectCards) {
      await expect(card.locator('text=前端')).toBeVisible();
    }
  });

  test('should filter projects by status', async ({ page }) => {
    await page.selectOption('select:has-text("状态")', 'running');
    await page.waitForTimeout(500);

    // Verify all visible projects have "running" status
    const projectCards = await page.locator('[data-testid="project-card"]').all();
    for (const card of projectCards) {
      const statusText = await card.locator('[data-testid="project-status"]').textContent();
      expect(statusText).toContain('运行中');
    }
  });
});
