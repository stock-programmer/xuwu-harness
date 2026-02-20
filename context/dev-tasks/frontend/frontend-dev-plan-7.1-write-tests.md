# Task: 编写核心模块单元测试

## 元数据
- **Task ID**: frontend-dev-plan-7.1
- **Layer**: 7
- **Dependencies**: [6.1, 6.2]
- **Parallel Group**: [7.1, 7.2]
- **Estimated Complexity**: Medium

## 目标
为核心模块编写单元测试，包括工具函数、Store、API 客户端、组件等的测试用例。

## 前置条件
- Dashboard 和 ProjectView 已实现（Layer 6 完成）

## 实现步骤

### 1. 安装测试依赖
```bash
cd frontend
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom
```

### 2. 配置 Vitest
创建 `vitest.config.ts`：
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3. 创建测试设置文件
创建 `src/tests/setup.ts`：
```typescript
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// 扩展 expect 断言
expect.extend(matchers);

// 每个测试后清理
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});
```

### 4. 工具函数测试
创建 `src/utils/__tests__/format.test.ts`：
```typescript
import { describe, it, expect } from 'vitest';
import {
  formatDateTime,
  formatDate,
  formatRelativeTime,
  formatDuration,
  formatFileSize,
} from '../format';

describe('format utils', () => {
  describe('formatDateTime', () => {
    it('should format date to YYYY-MM-DD HH:mm:ss', () => {
      const date = new Date('2024-01-15T10:30:45');
      const result = formatDateTime(date);
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });

    it('should handle string input', () => {
      const result = formatDateTime('2024-01-15T10:30:45');
      expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
    });
  });

  describe('formatFileSize', () => {
    it('should format 0 bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(500)).toBe('500.00 B');
    });

    it('should format KB', () => {
      expect(formatFileSize(1024)).toBe('1.00 KB');
    });

    it('should format MB', () => {
      expect(formatFileSize(1024 * 1024)).toBe('1.00 MB');
    });

    it('should format GB', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.00 GB');
    });
  });

  describe('formatDuration', () => {
    it('should format seconds', () => {
      expect(formatDuration(5000)).toBe('5秒');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(125000)).toBe('2分钟5秒');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(3665000)).toBe('1小时1分钟');
    });
  });
});
```

创建 `src/utils/__tests__/dag.test.ts`：
```typescript
import { describe, it, expect } from 'vitest';
import { topologicalSort, detectCyclicDependency, groupTasksByLayer } from '../dag';
import { TaskNode, TaskMetadata } from '@/types/task.types';

describe('DAG utils', () => {
  const mockTasks: TaskNode[] = [
    {
      id: '1.1',
      metadata: { id: '1.1', name: 'Task 1.1', layer: 1, dependencies: [], description: '', file: '', estimatedComplexity: 'Low' },
      status: 'pending',
      dependencies: [],
      dependents: ['2.1'],
    },
    {
      id: '2.1',
      metadata: { id: '2.1', name: 'Task 2.1', layer: 2, dependencies: ['1.1'], description: '', file: '', estimatedComplexity: 'Low' },
      status: 'pending',
      dependencies: ['1.1'],
      dependents: [],
    },
  ];

  describe('topologicalSort', () => {
    it('should sort tasks in correct order', () => {
      const result = topologicalSort(mockTasks);
      expect(result).toEqual(['1.1', '2.1']);
    });

    it('should throw error on circular dependency', () => {
      const circularTasks: TaskNode[] = [
        {
          id: 'A',
          metadata: { id: 'A', name: 'Task A', layer: 1, dependencies: ['B'], description: '', file: '', estimatedComplexity: 'Low' },
          status: 'pending',
          dependencies: ['B'],
          dependents: [],
        },
        {
          id: 'B',
          metadata: { id: 'B', name: 'Task B', layer: 1, dependencies: ['A'], description: '', file: '', estimatedComplexity: 'Low' },
          status: 'pending',
          dependencies: ['A'],
          dependents: [],
        },
      ];

      expect(() => topologicalSort(circularTasks)).toThrow('Circular dependency detected');
    });
  });

  describe('detectCyclicDependency', () => {
    it('should return false for valid DAG', () => {
      expect(detectCyclicDependency(mockTasks)).toBe(false);
    });

    it('should return true for circular dependency', () => {
      const circularTasks: TaskNode[] = [
        {
          id: 'A',
          metadata: { id: 'A', name: 'Task A', layer: 1, dependencies: ['B'], description: '', file: '', estimatedComplexity: 'Low' },
          status: 'pending',
          dependencies: ['B'],
          dependents: [],
        },
        {
          id: 'B',
          metadata: { id: 'B', name: 'Task B', layer: 1, dependencies: ['A'], description: '', file: '', estimatedComplexity: 'Low' },
          status: 'pending',
          dependencies: ['A'],
          dependents: [],
        },
      ];

      expect(detectCyclicDependency(circularTasks)).toBe(true);
    });
  });

  describe('groupTasksByLayer', () => {
    it('should group tasks by layer', () => {
      const metadata: TaskMetadata[] = mockTasks.map(t => t.metadata);
      const result = groupTasksByLayer(metadata);

      expect(result.size).toBe(2);
      expect(result.get(1)).toHaveLength(1);
      expect(result.get(2)).toHaveLength(1);
    });
  });
});
```

### 5. Store 测试
创建 `src/store/__tests__/app.store.test.ts`：
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../app.store';

describe('App Store', () => {
  beforeEach(() => {
    // 重置 store
    useAppStore.setState({
      user: null,
      isLoading: false,
      sidebarCollapsed: false,
    });
  });

  it('should set user', () => {
    const { setUser } = useAppStore.getState();
    const mockUser = {
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin' as const,
    };

    setUser(mockUser);

    expect(useAppStore.getState().user).toEqual(mockUser);
  });

  it('should toggle sidebar', () => {
    const { toggleSidebar } = useAppStore.getState();

    expect(useAppStore.getState().sidebarCollapsed).toBe(false);

    toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(true);

    toggleSidebar();
    expect(useAppStore.getState().sidebarCollapsed).toBe(false);
  });

  it('should logout', () => {
    const { setUser, logout } = useAppStore.getState();

    setUser({
      id: '1',
      name: 'Test User',
      email: 'test@example.com',
      role: 'admin',
    });

    logout();

    expect(useAppStore.getState().user).toBeNull();
  });
});
```

### 6. 组件测试
创建 `src/components/common/__tests__/RouteGuard.test.tsx`：
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { RouteGuard } from '../RouteGuard/RouteGuard';
import { useAppStore } from '@/store';

vi.mock('@/store');

describe('RouteGuard', () => {
  beforeEach(() => {
    vi.mocked(useAppStore).mockReturnValue({
      user: null,
      isLoading: false,
      checkAuth: vi.fn(),
      // ...其他必需的 store 属性
    } as any);
  });

  it('should redirect to login when not authenticated', () => {
    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <RouteGuard requireAuth={true}>
                <div>Protected Content</div>
              </RouteGuard>
            }
          />
          <Route path="/login" element={<div>Login Page</div>} />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('should render children when authenticated', () => {
    vi.mocked(useAppStore).mockReturnValue({
      user: { id: '1', name: 'Test User', email: 'test@example.com', role: 'admin' },
      isLoading: false,
      checkAuth: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <Routes>
          <Route
            path="/"
            element={
              <RouteGuard requireAuth={true}>
                <div>Protected Content</div>
              </RouteGuard>
            }
          />
        </Routes>
      </BrowserRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });
});
```

### 7. API 客户端测试
创建 `src/services/api/__tests__/http-client.test.ts`：
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { httpClient } from '../http-client';
import axios from 'axios';

vi.mock('axios');

describe('HTTP Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should make GET request', async () => {
    const mockData = { id: 1, name: 'Test' };
    vi.mocked(axios.create).mockReturnValue({
      get: vi.fn().mockResolvedValue({ data: mockData }),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    } as any);

    const result = await httpClient.get('/test');
    expect(result).toEqual(mockData);
  });

  it('should make POST request', async () => {
    const mockData = { id: 1, name: 'Created' };
    const postData = { name: 'New Item' };

    vi.mocked(axios.create).mockReturnValue({
      post: vi.fn().mockResolvedValue({ data: mockData }),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() },
      },
    } as any);

    const result = await httpClient.post('/test', postData);
    expect(result).toEqual(mockData);
  });
});
```

### 8. 更新 package.json 添加测试脚本
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 9. 创建测试工具函数
创建 `src/tests/utils/test-utils.tsx`：
```typescript
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConfigProvider } from 'antd';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

interface AllProvidersProps {
  children: React.ReactNode;
}

const AllProviders: React.FC<AllProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider>
          {children}
        </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## 期望输出
- ✅ vitest 和测试库安装完成
- ✅ `vitest.config.ts` 配置完成
- ✅ `src/tests/setup.ts` 测试设置文件
- ✅ 工具函数测试（format, dag, file, validation 等）
- ✅ Store 测试（app.store, mode.store 等）
- ✅ 组件测试（RouteGuard 等）
- ✅ API 客户端测试
- ✅ 测试工具函数
- ✅ 测试覆盖率 > 70%

## 验证标准
```bash
# 运行测试
npm run test

# 查看测试 UI
npm run test:ui

# 生成覆盖率报告
npm run test:coverage

# 应该看到：
# - 所有测试通过
# - 覆盖率报告生成
# - 核心模块测试覆盖率 > 70%
```

## Claude 执行 Prompt

请为核心模块编写单元测试，具体要求如下：

1. **安装测试依赖**：
   - vitest, @vitest/ui
   - @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
   - jsdom

2. **配置 Vitest**（vitest.config.ts）：
   - 设置 jsdom 环境
   - 配置路径别名
   - 配置覆盖率报告
   - 排除测试文件和配置文件

3. **创建测试设置**（src/tests/setup.ts）：
   - 扩展 expect 断言
   - Mock window.matchMedia
   - Mock localStorage
   - 每个测试后清理

4. **工具函数测试**：
   - src/utils/__tests__/format.test.ts
   - src/utils/__tests__/dag.test.ts
   - 测试所有导出的工具函数

5. **Store 测试**：
   - src/store/__tests__/app.store.test.ts
   - 测试所有 actions
   - 测试状态更新

6. **组件测试**：
   - src/components/common/__tests__/RouteGuard.test.tsx
   - 测试路由守卫逻辑
   - 测试重定向行为

7. **API 客户端测试**：
   - src/services/api/__tests__/http-client.test.ts
   - Mock axios
   - 测试 GET/POST/PUT/DELETE

8. **创建测试工具**（src/tests/utils/test-utils.tsx）：
   - 封装 render 函数
   - 提供所有 Providers

9. **更新 package.json**：
   - 添加测试脚本

10. **验证**：
    - 所有测试通过
    - 覆盖率 > 70%

确保测试全面、可靠、易于维护。
