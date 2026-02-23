import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { openProject } from './helpers/project';

test.describe('Mode Control', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // Navigate to a test project
    // await openProject(page, 'Test Project');
    await page.goto('/dashboard');
  });

  test('should display work modes', async ({ page }) => {
    const modes = [
      '编写产品需求文档（PRD）',
      '生成架构设计文档',
      '生成开发计划（DAG）',
      '生成任务文件',
      '执行任务',
      '循环测试',
      '部署上线',
    ];

    for (const mode of modes) {
      await expect(page.locator(`text=${mode}`)).toBeVisible();
    }
  });

  test('should switch between work modes', async ({ page }) => {
    const modes = [
      '编写产品需求文档（PRD）',
      '生成架构设计文档',
      '生成开发计划（DAG）',
    ];

    for (const mode of modes) {
      await page.click(`text=${mode}`);
      await page.waitForTimeout(200);
      // Verify mode is selected
      const modeRadio = page.locator(`input[value="${mode}"]`);
      await expect(modeRadio).toBeChecked();
    }
  });

  test('should submit prompt', async ({ page }) => {
    // Select mode
    await page.click('text=编写产品需求文档（PRD）');

    // Input prompt
    const promptText = 'Test prompt for E2E testing';
    await page.fill('textarea[placeholder*="Prompt"]', promptText);

    // Submit
    await page.click('button:has-text("提交")');

    // Wait for submission
    await page.waitForTimeout(1000);

    // Verify output in console (optional, depends on implementation)
    // You might want to check if the prompt appears in the output console
  });

  test('should clear prompt', async ({ page }) => {
    // Fill textarea
    await page.fill('textarea[placeholder*="Prompt"]', 'Some text');

    // Click clear button
    await page.click('button:has-text("清空")');

    // Verify textarea is empty
    const textareaValue = await page.inputValue('textarea[placeholder*="Prompt"]');
    expect(textareaValue).toBe('');
  });

  test('should disable submit when prompt is empty', async ({ page }) => {
    // Clear textarea if it has content
    await page.fill('textarea[placeholder*="Prompt"]', '');

    // Check if submit button is disabled
    const submitButton = page.locator('button:has-text("提交")');
    await expect(submitButton).toBeDisabled();
  });

  test('should enable submit when prompt has content', async ({ page }) => {
    // Fill textarea
    await page.fill('textarea[placeholder*="Prompt"]', 'Some content');

    // Check if submit button is enabled
    const submitButton = page.locator('button:has-text("提交")');
    await expect(submitButton).toBeEnabled();
  });

  test('should display prompt templates', async ({ page }) => {
    // Check if templates section is visible
    await expect(page.locator('text=快速模板')).toBeVisible();

    // Try clicking a template if available
    const templates = page.locator('[data-testid="prompt-template"]');
    const count = await templates.count();
    if (count > 0) {
      await templates.first().click();

      // Verify template content is loaded into textarea
      const textareaValue = await page.inputValue('textarea[placeholder*="Prompt"]');
      expect(textareaValue.length).toBeGreaterThan(0);
    }
  });
});
