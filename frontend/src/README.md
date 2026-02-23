# Frontend 源代码目录结构

## 目录说明

- **assets/**: 静态资源（图片、图标、字体）
- **components/**: 通用组件
  - common/: 基础组件（Button、Input 等）
  - layout/: 布局组件（Header、Sidebar 等）
  - business/: 业务组件（FileTree、CodeEditor 等）
- **pages/**: 页面组件
- **features/**: 功能模块（按功能划分）
  - file-explorer/: 文件浏览器
  - output-console/: 输出控制台
  - mode-control/: 模式控制
  - task-execution/: 任务执行
- **store/**: 状态管理（Zustand stores）
- **services/**: 服务层
  - api/: HTTP API
  - websocket/: WebSocket 客户端
  - storage/: 本地存储
- **hooks/**: 自定义 React Hooks
- **utils/**: 工具函数
- **types/**: TypeScript 类型定义
- **constants/**: 常量定义
- **styles/**: 全局样式
- **tests/**: 测试文件

## 路径别名

使用 `@/` 前缀导入模块：

```typescript
import { Something } from '@/components/common';
import { useAppStore } from '@/store';
import { formatDate } from '@/utils/format';
```
