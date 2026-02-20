# Task: 定义 Sequelize 数据模型

## 元数据
- **Task ID**: backend-2.1
- **Layer**: 2
- **Dependencies**: [1.4]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7]
- **Estimated Complexity**: Medium

## 目标
定义所有数据库模型，包括 Project、TaskExecution、LayerExecution、ExecutionLog、TestRun、Deployment 等，实现模型关联和索引配置。

## 前置条件
- 数据库连接已配置（Task 1.4）
- Sequelize 已安装
- TypeScript 环境已就绪

## 实现步骤

### 1. 创建 Project 模型
创建 `src/models/Project.ts`：
```typescript
import { Model, DataTypes, Optional } from 'sequelize';
import { sequelize } from '@/config/database';

interface ProjectAttributes {
  id: string;
  name: string;
  type: 'fullstack' | 'frontend' | 'backend';
  status: string;
  current_mode: string | null;
  root_path: string;
  created_at: Date;
  updated_at: Date;
}

interface ProjectCreationAttributes extends Optional<ProjectAttributes, 'id' | 'current_mode' | 'created_at' | 'updated_at'> {}

export class Project extends Model<ProjectAttributes, ProjectCreationAttributes> implements ProjectAttributes {
  public id!: string;
  public name!: string;
  public type!: 'fullstack' | 'frontend' | 'backend';
  public status!: string;
  public current_mode!: string | null;
  public root_path!: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Project.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    status: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    current_mode: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    root_path: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'projects',
    underscored: true,
    timestamps: true,
  }
);
```

### 2. 创建 TaskExecution 模型
创建 `src/models/TaskExecution.ts`（类似结构）

### 3. 创建 LayerExecution 模型
创建 `src/models/LayerExecution.ts`

### 4. 创建 ExecutionLog 模型
创建 `src/models/ExecutionLog.ts`

### 5. 创建 TestRun 模型
创建 `src/models/TestRun.ts`

### 6. 创建 Deployment 模型
创建 `src/models/Deployment.ts`

### 7. 创建模型导出文件
创建 `src/models/index.ts`：
```typescript
export { Project } from './Project';
export { TaskExecution } from './TaskExecution';
export { LayerExecution } from './LayerExecution';
export { ExecutionLog } from './ExecutionLog';
export { TestRun } from './TestRun';
export { Deployment } from './Deployment';

// 配置模型关联
import { Project } from './Project';
import { TaskExecution } from './TaskExecution';
import { LayerExecution } from './LayerExecution';

Project.hasMany(TaskExecution, { foreignKey: 'project_id' });
Project.hasMany(LayerExecution, { foreignKey: 'project_id' });
TaskExecution.belongsTo(Project, { foreignKey: 'project_id' });
LayerExecution.belongsTo(Project, { foreignKey: 'project_id' });
```

## 期望输出

### 文件结构
```
src/models/
├── index.ts
├── Project.ts
├── TaskExecution.ts
├── LayerExecution.ts
├── ExecutionLog.ts
├── TestRun.ts
└── Deployment.ts
```

### 模型列表
- Project
- TaskExecution
- LayerExecution
- ExecutionLog
- TestRun
- Deployment

## 验证标准

### 1. TypeScript 编译
```bash
npm run build
```
预期：无类型错误

### 2. 模型创建验证
```typescript
import { Project } from '@/models/Project';

const project = await Project.create({
  name: 'Test Project',
  type: 'fullstack',
  status: 'initializing',
  root_path: '/path/to/project'
});

console.log(project.id); // 应该有UUID
```

### 3. 关联验证
验证模型之间的关联是否正确配置

## Claude 执行 Prompt

请在 backend 项目中执行以下任务：

1. 在 src/models/ 目录下创建以下数据模型文件：
   - Project.ts（项目表）
   - TaskExecution.ts（任务执行记录表）
   - LayerExecution.ts（层级执行记录表）
   - ExecutionLog.ts（执行日志表）
   - TestRun.ts（测试运行记录表）
   - Deployment.ts（部署记录表）

2. 每个模型需要包含：
   - TypeScript 接口定义（Attributes 和 CreationAttributes）
   - Sequelize Model 类
   - init() 方法配置字段和选项

3. Project 模型字段：
   - id (UUID, 主键)
   - name (字符串)
   - type ('fullstack' | 'frontend' | 'backend')
   - status (字符串)
   - current_mode (字符串, 可空)
   - root_path (字符串)
   - created_at, updated_at (时间戳)

4. 其他模型参考 backend-architecture.md 中的数据库设计部分

5. 创建 src/models/index.ts，导出所有模型并配置模型关联：
   - Project hasMany TaskExecution
   - Project hasMany LayerExecution
   - TaskExecution belongsTo Project
   - 等等

6. 验证：
   - 运行 `npm run build`，确保无TypeScript错误
   - 确认所有模型都正确导出

确保所有数据模型定义完整，类型安全，关联关系正确。
