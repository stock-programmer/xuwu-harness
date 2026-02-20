# Task: 实现 Mode Handlers（模式处理器）

## 元数据
- **Task ID**: backend-4.3
- **Layer**: 4
- **Dependencies**: [4.1]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4, 4.5]
- **Estimated Complexity**: High

## 目标
为7个工作模式实现专门的处理器，处理模式特定逻辑和输出验证。

## 前置条件
- Workflow Orchestrator 已实现（Task 4.1）

## 实现步骤

### 1. 创建 Mode Handler 接口
创建 `src/services/workflow/handlers/BaseModeHandler.ts`：
```typescript
import { ModeExecutionResult } from '@/types/workflow.types';

export abstract class BaseModeHandler {
  abstract execute(input: string, context: any): Promise<ModeExecutionResult>;
  abstract validatePreconditions(context: any): Promise<boolean>;
  abstract validateOutput(result: any): Promise<boolean>;
}
```

### 2. 创建各模式处理器
- `PRDModeHandler.ts`
- `ArchitectureModeHandler.ts`
- `DevPlanModeHandler.ts`
- `TaskGenModeHandler.ts`
- `TaskExecModeHandler.ts`
- `LoopTestModeHandler.ts`
- `DeployModeHandler.ts`

每个处理器实现特定模式的：
- 前置条件验证
- 执行逻辑
- 输出验证
- 产物提取

## 验证标准

测试每个模式处理器的执行流程。

## Claude 执行 Prompt

请实现 7 个模式处理器，每个继承 BaseModeHandler，实现execute、validatePreconditions、validateOutput 方法。
