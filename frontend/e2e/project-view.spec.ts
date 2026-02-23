import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { createProject, openProject, deleteProject } from './helpers/project';

test.describe('Project View', () => {
  const projectName = `E2E Test Project ${Date.now()}`;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    await createProject(page, {
      name: projectName,
      type: 'fullstack',
      rootPath: '/tmp/e2e-test',
    });
    await page.close();
  });

  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await login(page);
    await deleteProject(page, projectName);
    await page.close();
  });

  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProject(page, projectName);
  });

  test('should display project information', async ({ page }) => {
    await expect(page.locator(`text=${projectName}`)).toBeVisible();
    await expect(page.locator('text=WebSocket:')).toBeVisible();
    await expect(page.locator('text=状态:')).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    // Click File Editor tab
    await page.click('text=文件编辑器');
    await page.waitForTimeout(300);

    // Click Task Dashboard tab
    await page.click('text=任务仪表板');
    await expect(page.locator('text=任务执行仪表板')).toBeVisible();

    // Click Progress Monitor tab
    await page.click('text=进度监控');
    await expect(page.locator('text=执行进度监控')).toBeVisible();
  });

  test('should display output console', async ({ page }) => {
    await expect(page.locator('text=输出控制台')).toBeVisible();
  });

  test('should display mode control', async ({ page }) => {
    await expect(page.locator('text=工作模式')).toBeVisible();
    await expect(page.locator('text=Prompt 输入')).toBeVisible();
  });

  test('should show WebSocket connection status', async ({ page }) => {
    const wsStatus = page.locator('text=WebSocket:').locator('..');
    await expect(wsStatus).toBeVisible();
    // Status should be either connected or disconnected
    const connected = await wsStatus.locator('text=已连接').count();
    const disconnected = await wsStatus.locator('text=未连接').count();
    expect(connected + disconnected).toBeGreaterThan(0);
  });

  test('should display task dashboard with layers', async ({ page }) => {
    await page.click('text=任务仪表板');
    await expect(page.locator('text=当前 Layer')).toBeVisible();
    await expect(page.locator('text=总进度')).toBeVisible();
  });

  test('should display DAG visualization tab', async ({ page }) => {
    await page.click('text=任务仪表板');
    await page.click('text=DAG 视图');
    await expect(page.locator('text=任务依赖关系（DAG）')).toBeVisible();
  });
});
