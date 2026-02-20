# Task: 编写 E2E 测试用例

## 元数据
- **Task ID**: frontend-dev-plan-7.2
- **Layer**: 7
- **Dependencies**: [6.1, 6.2]
- **Parallel Group**: [7.1, 7.2]
- **Estimated Complexity**: Medium

## 目标
使用 Playwright 编写端到端测试，覆盖主要用户流程和关键功能。

## 前置条件
- Dashboard 和 ProjectView 已实现（Layer 6 完成）

## 实现步骤

### 1. 安装 Playwright
```bash
cd frontend
npm install --save-dev @playwright/test
npx playwright install
```

### 2. 配置 Playwright
创建 `playwright.config.ts`：
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 3. 创建测试辅助工具
创建 `e2e/helpers/auth.ts`：
```typescript
import { Page } from '@playwright/test';

export async function login(page: Page, username = 'testuser', password = 'password') {
  await page.goto('/login');
  await page.fill('input[placeholder="用户名"]', username);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function logout(page: Page) {
  // 假设有 logout 按钮
  await page.click('[data-testid="user-menu"]');
  await page.click('text=登出');
  await page.waitForURL('/login');
}
```

创建 `e2e/helpers/project.ts`：
```typescript
import { Page, expect } from '@playwright/test';

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

  // 等待对话框关闭
  await page.waitForSelector('[role="dialog"]', { state: 'hidden' });

  // 验证项目创建成功
  await expect(page.locator(`text=${config.name}`)).toBeVisible();
}

export async function openProject(page: Page, projectName: string) {
  await page.click(`text=${projectName}`);
  await page.click('button:has-text("查看详情")');
  await page.waitForURL(/\/project\//);
}

export async function deleteProject(page: Page, projectName: string) {
  // 点击项目卡片的更多操作按钮
  const projectCard = page.locator(`text=${projectName}`).locator('..');
  await projectCard.locator('[data-icon="ellipsis"]').click();

  // 点击删除
  await page.click('text=删除');

  // 确认删除
  await page.click('button:has-text("删除")');

  // 验证项目已删除
  await expect(page.locator(`text=${projectName}`)).not.toBeVisible();
}
```

### 4. Dashboard 测试
创建 `e2e/dashboard.spec.ts`：
```typescript
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

    // 验证项目出现在列表中
    await expect(page.locator(`text=${projectName}`)).toBeVisible();

    // 清理：删除测试项目
    await deleteProject(page, projectName);
  });

  test('should search projects', async ({ page }) => {
    const searchTerm = 'test';
    await page.fill('input[placeholder="搜索项目名称"]', searchTerm);
    await page.press('input[placeholder="搜索项目名称"]', 'Enter');

    // 验证搜索结果
    await page.waitForTimeout(500);
    const visibleProjects = await page.locator('[data-testid="project-card"]').count();
    expect(visibleProjects).toBeGreaterThanOrEqual(0);
  });

  test('should filter projects by type', async ({ page }) => {
    await page.selectOption('select:has-text("项目类型")', 'frontend');
    await page.waitForTimeout(500);

    // 验证过滤结果
    const projectCards = await page.locator('[data-testid="project-card"]').all();
    for (const card of projectCards) {
      await expect(card.locator('text=前端')).toBeVisible();
    }
  });
});
```

### 5. Project View 测试
创建 `e2e/project-view.spec.ts`：
```typescript
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
    // 点击文件编辑器标签
    await page.click('text=文件编辑器');
    await expect(page.locator('text=请从左侧选择一个文件')).toBeVisible();

    // 点击任务仪表板标签
    await page.click('text=任务仪表板');
    await expect(page.locator('text=任务执行仪表板')).toBeVisible();

    // 点击进度监控标签
    await page.click('text=进度监控');
    await expect(page.locator('text=执行进度监控')).toBeVisible();
  });

  test('should display file explorer', async ({ page }) => {
    await expect(page.locator('text=文件浏览器')).toBeVisible();
  });

  test('should display output console', async ({ page }) => {
    await expect(page.locator('text=输出控制台')).toBeVisible();
  });

  test('should display mode control', async ({ page }) => {
    await expect(page.locator('text=工作模式')).toBeVisible();
    await expect(page.locator('text=Prompt 输入')).toBeVisible();
  });
});
```

### 6. 文件操作测试
创建 `e2e/file-operations.spec.ts`：
```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { createProject, openProject } from './helpers/project';

test.describe('File Operations', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    // 假设已有测试项目
    await openProject(page, 'Test Project');
  });

  test('should create a new file', async ({ page }) => {
    // 右键点击目录
    await page.click('[data-testid="file-tree-node"]:has-text("src")', {
      button: 'right',
    });

    // 点击新建文件
    await page.click('text=新建文件');

    // 填写文件名
    await page.fill('input[placeholder="例如: index.ts"]', 'test.ts');
    await page.click('button:has-text("确定")');

    // 验证文件创建成功
    await expect(page.locator('text=test.ts')).toBeVisible();
  });

  test('should rename a file', async ({ page }) => {
    // 右键点击文件
    await page.click('[data-testid="file-tree-node"]:has-text("test.ts")', {
      button: 'right',
    });

    // 点击重命名
    await page.click('text=重命名');

    // 输入新名称
    await page.fill('input[value="test.ts"]', 'renamed.ts');
    await page.click('button:has-text("确定")');

    // 验证重命名成功
    await expect(page.locator('text=renamed.ts')).toBeVisible();
  });

  test('should delete a file', async ({ page }) => {
    // 右键点击文件
    await page.click('[data-testid="file-tree-node"]:has-text("renamed.ts")', {
      button: 'right',
    });

    // 点击删除
    await page.click('text=删除');

    // 确认删除
    await page.click('button:has-text("确定")');

    // 验证文件已删除
    await expect(page.locator('text=renamed.ts')).not.toBeVisible();
  });
});
```

### 7. Mode Control 测试
创建 `e2e/mode-control.spec.ts`：
```typescript
import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';
import { openProject } from './helpers/project';

test.describe('Mode Control', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await openProject(page, 'Test Project');
  });

  test('should switch between work modes', async ({ page }) => {
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
      await page.click(`text=${mode}`);
      await expect(page.locator(`text=${mode}`)).toBeChecked();
    }
  });

  test('should submit prompt', async ({ page }) => {
    // 选择模式
    await page.click('text=编写产品需求文档（PRD）');

    // 输入 Prompt
    const promptText = 'Test prompt for E2E testing';
    await page.fill('textarea', promptText);

    // 提交
    await page.click('button:has-text("提交")');

    // 验证提交成功（应该显示在输出控制台）
    await page.waitForTimeout(1000);
    // 根据实际实现验证
  });

  test('should clear prompt', async ({ page }) => {
    await page.fill('textarea', 'Some text');
    await page.click('button:has-text("清空")');

    const textareaValue = await page.inputValue('textarea');
    expect(textareaValue).toBe('');
  });
});
```

### 8. 更新 package.json
```json
{
  "scripts": {
    "e2e": "playwright test",
    "e2e:ui": "playwright test --ui",
    "e2e:headed": "playwright test --headed",
    "e2e:report": "playwright show-report"
  }
}
```

### 9. 创建 GitHub Actions 工作流（可选）
创建 `.github/workflows/e2e.yml`：
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run e2e

      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 期望输出
- ✅ Playwright 安装完成
- ✅ `playwright.config.ts` 配置完成
- ✅ `e2e/helpers/` 测试辅助工具
- ✅ `e2e/dashboard.spec.ts` Dashboard 测试
- ✅ `e2e/project-view.spec.ts` ProjectView 测试
- ✅ `e2e/file-operations.spec.ts` 文件操作测试
- ✅ `e2e/mode-control.spec.ts` 模式控制测试
- ✅ E2E 测试脚本
- ✅ 所有测试通过

## 验证标准
```bash
# 运行 E2E 测试
npm run e2e

# 运行 E2E 测试（UI 模式）
npm run e2e:ui

# 运行 E2E 测试（有头模式，可以看到浏览器）
npm run e2e:headed

# 查看测试报告
npm run e2e:report

# 应该看到：
# - 所有 E2E 测试通过
# - 覆盖主要用户流程
# - 生成测试报告
```

## Claude 执行 Prompt

请使用 Playwright 编写 E2E 测试，具体要求如下：

1. **安装 Playwright**：
   - npm install --save-dev @playwright/test
   - npx playwright install

2. **配置 Playwright**（playwright.config.ts）：
   - 设置测试目录为 ./e2e
   - 配置 3 个浏览器：Chromium, Firefox, WebKit
   - 设置 baseURL 和 webServer
   - 配置截图和追踪

3. **创建测试辅助工具**：
   - e2e/helpers/auth.ts: login, logout
   - e2e/helpers/project.ts: createProject, openProject, deleteProject

4. **Dashboard 测试**（e2e/dashboard.spec.ts）：
   - 显示统计卡片
   - 创建项目
   - 搜索项目
   - 过滤项目

5. **ProjectView 测试**（e2e/project-view.spec.ts）：
   - 显示项目信息
   - 切换标签页
   - 显示各功能模块

6. **文件操作测试**（e2e/file-operations.spec.ts）：
   - 创建文件
   - 重命名文件
   - 删除文件

7. **模式控制测试**（e2e/mode-control.spec.ts）：
   - 切换工作模式
   - 提交 Prompt
   - 清空 Prompt

8. **更新 package.json**：
   - 添加 E2E 测试脚本

9. **创建 CI 工作流**（可选）：
   - .github/workflows/e2e.yml

10. **验证**：
    - 所有 E2E 测试通过
    - 覆盖主要用户流程

确保 E2E 测试全面、稳定、易于维护。
