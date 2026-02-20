# Task: 实现 Workflow Orchestrator（工作流编排器）

## 元数据
- **Task ID**: backend-4.1
- **Layer**: 4
- **Dependencies**: [2.3, 3.1]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4, 4.5]
- **Estimated Complexity**: High

## 目标
实现7种工作模式的管理和编排，包括模式切换、执行流程、进度跟踪和状态管理。

## 前置条件
- TypeScript 类型已定义（Task 2.3）
- Claude Executor 已实现（Task 3.1）

## 实现步骤

### 1. 定义工作模式枚举
```typescript
export enum WorkMode {
  PRD = 'prd',
  ARCHITECTURE = 'architecture',
  DEV_PLAN = 'dev_plan',
  TASK_GEN = 'task_gen',
  TASK_EXEC = 'task_exec',
  LOOP_TEST = 'loop_test',
  DEPLOY = 'deploy',
}
```

### 2. 创建编排器类
创建 `src/services/workflow/WorkflowOrchestrator.ts`：
```typescript
export class WorkflowOrchestrator {
  private currentMode: WorkMode = WorkMode.PRD;
  private modeHistory: WorkMode[] = [];

  async executeMode(mode: WorkMode, input: string): Promise<ModeExecutionResult> {
    // 实现模式执行逻辑
  }

  async switchMode(mode: WorkMode): Promise<void> {
    // 实现模式切换
  }

  getCurrentMode(): WorkMode {
    return this.currentMode;
  }
}
```

### 3. 实现模式前置条件验证
- PRD: 无前置条件
- ARCHITECTURE: 需要 PRD 文档存在
- DEV_PLAN: 需要架构文档存在
- 等等...

### 4. 实现模式间数据传递
- 读取前置模式的输出
- 准备执行上下文
- 传递给 Claude Executor

## 期望输出
- `src/services/workflow/WorkflowOrchestrator.ts`
- 7种模式的管理逻辑
- 模式状态机
- 进度追踪

## 验证标准

```typescript
const result = await workflowOrchestrator.executeMode(WorkMode.PRD, '构建博客系统');
expect(result.success).toBe(true);
expect(fs.existsSync('context/prd/prd.md')).toBe(true);
```

## Claude 执行 Prompt

请实现工作流编排器：

1. 创建 src/services/workflow/WorkflowOrchestrator.ts
2. 定义 WorkMode 枚举（7种模式）
3. 实现 WorkflowOrchestrator 类，包含：
   - executeMode(): 执行指定模式
   - switchMode(): 切换模式
   - getCurrentMode(): 获取当前模式
   - validateModePreconditions(): 验证前置条件
   - prepareExecutionContext(): 准备执行上下文
   - buildModePrompt(): 构建 Claude prompt
   - extractArtifacts(): 提取输出产物
   - getNextMode(): 确定下一个模式
4. 实现模式历史记录（modeHistory）
5. 导出单例 workflowOrchestrator

参考 backend-architecture.md 第 4.2 节。
