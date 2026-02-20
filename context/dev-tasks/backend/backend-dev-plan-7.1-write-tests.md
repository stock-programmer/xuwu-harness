# Task: 编写单元测试和集成测试

## 元数据
- **Task ID**: backend-7.1
- **Layer**: 7
- **Dependencies**: [6.1]
- **Parallel Group**: [7.1, 7.2]
- **Estimated Complexity**: Medium

## 目标
配置测试框架，编写单元测试和集成测试，确保代码质量和覆盖率达标。

## 前置条件
- 应用已整合完成（Task 6.1）
- 所有核心功能已实现

## 实现步骤

### 1. 安装测试依赖
```bash
cd backend
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

### 2. 配置 Jest
创建 `jest.config.js`：
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

### 3. 编写单元测试示例
创建 `src/services/__tests__/DAGParser.test.ts`：
```typescript
import { dagParser } from '../dag/DAGParser';

describe('DAGParser', () => {
  it('should parse valid task index', async () => {
    const taskIndex = await dagParser.parseTaskIndex('./test-data/tasks-index.json');
    expect(taskIndex.total_tasks).toBeGreaterThan(0);
  });

  it('should detect circular dependencies', () => {
    // 测试循环依赖检测
  });
});
```

### 4. 编写集成测试
创建 `src/__tests__/api.test.ts`

### 5. 添加测试脚本
在 package.json 中：
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 期望输出
- jest.config.js
- 单元测试文件
- 集成测试文件
- 测试覆盖率 > 70%

## 验证标准

```bash
npm test
# 所有测试通过

npm run test:coverage
# 覆盖率达标
```

## Claude 执行 Prompt

请配置并编写测试：

1. 安装测试依赖：jest、ts-jest、supertest

2. 创建 jest.config.js 配置文件

3. 编写单元测试：
   - DAGParser 测试
   - ClaudeCodeExecutor 测试
   - WorkflowOrchestrator 测试

4. 编写集成测试：
   - API 端点测试
   - 完整工作流测试

5. 配置测试脚本

6. 运行测试确保通过

参考 backend-architecture.md 第 12 节。
