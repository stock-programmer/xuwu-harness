# Task: 实现通用工具函数

## 元数据
- **Task ID**: frontend-dev-plan-3.5
- **Layer**: 3
- **Dependencies**: [2.6]
- **Parallel Group**: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6]
- **Estimated Complexity**: Medium

## 目标
实现日期格式化、文件处理、DAG 工具、验证函数等通用工具函数库。

## 前置条件
- 目录结构已创建（Task 2.6 完成）

## 实现步骤

### 1. 创建日期格式化工具
创建 `src/utils/format.ts`：
```typescript
/**
 * 格式化日期为 YYYY-MM-DD HH:mm:ss
 */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

/**
 * 格式化日期为 YYYY-MM-DD
 */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * 格式化相对时间（如：3分钟前）
 */
export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}天前`;
  if (hours > 0) return `${hours}小时前`;
  if (minutes > 0) return `${minutes}分钟前`;
  if (seconds > 0) return `${seconds}秒前`;
  return '刚刚';
};

/**
 * 格式化持续时间（毫秒 -> 可读格式）
 */
export const formatDuration = (milliseconds: number): string => {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}小时${minutes % 60}分钟`;
  }
  if (minutes > 0) {
    return `${minutes}分钟${seconds % 60}秒`;
  }
  return `${seconds}秒`;
};

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
```

### 2. 创建文件处理工具
创建 `src/utils/file.ts`：
```typescript
import { FileNode } from '@/types/file.types';

/**
 * 获取文件扩展名
 */
export const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  return parts.length > 1 ? `.${parts[parts.length - 1]}` : '';
};

/**
 * 获取文件名（不含扩展名）
 */
export const getFileName = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length > 1) {
    return parts.slice(0, -1).join('.');
  }
  return filename;
};

/**
 * 判断是否为隐藏文件
 */
export const isHiddenFile = (filename: string): boolean => {
  return filename.startsWith('.');
};

/**
 * 根据扩展名获取编程语言
 */
export const getLanguageFromExtension = (extension: string): string => {
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescriptreact',
    '.js': 'javascript',
    '.jsx': 'javascriptreact',
    '.json': 'json',
    '.md': 'markdown',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.py': 'python',
    '.java': 'java',
    '.go': 'go',
    '.rs': 'rust',
    '.c': 'c',
    '.cpp': 'cpp',
    '.sh': 'shell',
  };

  return languageMap[extension.toLowerCase()] || 'plaintext';
};

/**
 * 构建文件树路径
 */
export const buildFilePath = (parentPath: string, fileName: string): string => {
  if (!parentPath || parentPath === '/') {
    return `/${fileName}`;
  }
  return `${parentPath}/${fileName}`;
};

/**
 * 从文件树中查找节点
 */
export const findNodeByPath = (
  nodes: FileNode[],
  path: string
): FileNode | null => {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findNodeByPath(node.children, path);
      if (found) return found;
    }
  }
  return null;
};

/**
 * 展平文件树
 */
export const flattenFileTree = (nodes: FileNode[]): FileNode[] => {
  const result: FileNode[] = [];

  const flatten = (nodes: FileNode[]) => {
    for (const node of nodes) {
      result.push(node);
      if (node.children) {
        flatten(node.children);
      }
    }
  };

  flatten(nodes);
  return result;
};
```

### 3. 创建 DAG 工具
创建 `src/utils/dag.ts`：
```typescript
import { TaskNode, TaskMetadata } from '@/types/task.types';

/**
 * 拓扑排序（获取执行顺序）
 */
export const topologicalSort = (nodes: TaskNode[]): string[] => {
  const result: string[] = [];
  const visited = new Set<string>();
  const visiting = new Set<string>();

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  const visit = (nodeId: string): boolean => {
    if (visited.has(nodeId)) return true;
    if (visiting.has(nodeId)) {
      throw new Error('Circular dependency detected');
    }

    visiting.add(nodeId);
    const node = nodeMap.get(nodeId);

    if (node) {
      for (const depId of node.dependencies) {
        if (!visit(depId)) return false;
      }
    }

    visiting.delete(nodeId);
    visited.add(nodeId);
    result.push(nodeId);

    return true;
  };

  for (const node of nodes) {
    if (!visited.has(node.id)) {
      visit(node.id);
    }
  }

  return result;
};

/**
 * 检测循环依赖
 */
export const detectCyclicDependency = (nodes: TaskNode[]): boolean => {
  try {
    topologicalSort(nodes);
    return false;
  } catch (error) {
    return true;
  }
};

/**
 * 按层级分组任务
 */
export const groupTasksByLayer = (tasks: TaskMetadata[]): Map<number, TaskMetadata[]> => {
  const layerMap = new Map<number, TaskMetadata[]>();

  for (const task of tasks) {
    const layer = task.layer;
    if (!layerMap.has(layer)) {
      layerMap.set(layer, []);
    }
    layerMap.get(layer)!.push(task);
  }

  return layerMap;
};

/**
 * 获取任务的所有依赖（递归）
 */
export const getAllDependencies = (
  taskId: string,
  nodeMap: Map<string, TaskNode>
): string[] => {
  const dependencies = new Set<string>();

  const collect = (id: string) => {
    const node = nodeMap.get(id);
    if (!node) return;

    for (const depId of node.dependencies) {
      if (!dependencies.has(depId)) {
        dependencies.add(depId);
        collect(depId);
      }
    }
  };

  collect(taskId);
  return Array.from(dependencies);
};

/**
 * 计算关键路径（最长路径）
 */
export const calculateCriticalPath = (nodes: TaskNode[]): string[] => {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));
  const depths = new Map<string, number>();

  const calculateDepth = (nodeId: string): number => {
    if (depths.has(nodeId)) {
      return depths.get(nodeId)!;
    }

    const node = nodeMap.get(nodeId);
    if (!node || node.dependencies.length === 0) {
      depths.set(nodeId, 0);
      return 0;
    }

    const maxDepth = Math.max(
      ...node.dependencies.map((depId) => calculateDepth(depId))
    );
    const depth = maxDepth + 1;
    depths.set(nodeId, depth);
    return depth;
  };

  // 计算所有节点深度
  nodes.forEach((node) => calculateDepth(node.id));

  // 找到最深的节点
  let maxDepth = 0;
  let endNode = '';
  depths.forEach((depth, nodeId) => {
    if (depth > maxDepth) {
      maxDepth = depth;
      endNode = nodeId;
    }
  });

  // 回溯关键路径
  const path: string[] = [];
  let current = endNode;

  while (current) {
    path.unshift(current);
    const node = nodeMap.get(current);
    if (!node || node.dependencies.length === 0) break;

    // 找到深度最大的依赖
    const currentDepth = depths.get(current)!;
    current = node.dependencies.find(
      (depId) => depths.get(depId) === currentDepth - 1
    ) || '';
  }

  return path;
};
```

### 4. 创建验证工具
创建 `src/utils/validation.ts`：
```typescript
/**
 * 验证是否为有效的项目名称
 */
export const isValidProjectName = (name: string): boolean => {
  // 只允许字母、数字、连字符、下划线
  const regex = /^[a-zA-Z0-9_-]+$/;
  return regex.test(name) && name.length >= 3 && name.length <= 50;
};

/**
 * 验证是否为有效的文件路径
 */
export const isValidFilePath = (path: string): boolean => {
  // 基本路径验证
  return path.length > 0 && !path.includes('..');
};

/**
 * 验证是否为有效的 URL
 */
export const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

/**
 * 验证是否为有效的 Email
 */
export const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * 清理路径（移除多余的斜杠）
 */
export const sanitizePath = (path: string): string => {
  return path.replace(/\/+/g, '/').replace(/\/$/, '');
};
```

### 5. 创建字符串工具
创建 `src/utils/string.ts`：
```typescript
/**
 * 截断字符串
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
};

/**
 * 首字母大写
 */
export const capitalize = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * 驼峰转连字符
 */
export const camelToKebab = (str: string): string => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};

/**
 * 连字符转驼峰
 */
export const kebabToCamel = (str: string): string => {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * 生成随机 ID
 */
export const generateId = (prefix = ''): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return prefix ? `${prefix}_${timestamp}_${random}` : `${timestamp}_${random}`;
};
```

### 6. 创建统一导出
更新 `src/utils/index.ts`：
```typescript
// 格式化工具
export * from './format';

// 文件工具
export * from './file';

// DAG 工具
export * from './dag';

// 验证工具
export * from './validation';

// 字符串工具
export * from './string';
```

## 期望输出
- ✅ `src/utils/format.ts` 日期和格式化工具
- ✅ `src/utils/file.ts` 文件处理工具
- ✅ `src/utils/dag.ts` DAG 相关工具
- ✅ `src/utils/validation.ts` 验证工具
- ✅ `src/utils/string.ts` 字符串工具
- ✅ `src/utils/index.ts` 统一导出
- ✅ 所有工具函数测试通过

## 验证标准
```typescript
import {
  formatDateTime,
  formatFileSize,
  getFileExtension,
  topologicalSort,
  isValidProjectName,
  generateId,
} from '@/utils';

// 测试格式化
console.log(formatDateTime(new Date())); // 2024-01-01 12:00:00
console.log(formatFileSize(1024 * 1024)); // 1.00 MB

// 测试文件工具
console.log(getFileExtension('test.ts')); // .ts

// 测试验证
console.log(isValidProjectName('my-project')); // true

// 测试 ID 生成
console.log(generateId('task')); // task_xxx_xxx
```

## Claude 执行 Prompt

请为前端项目实现完整的工具函数库，具体要求如下：

1. **创建格式化工具**（src/utils/format.ts）：
   - formatDateTime: 格式化日期时间
   - formatDate: 格式化日期
   - formatRelativeTime: 相对时间（3分钟前）
   - formatDuration: 持续时间格式化
   - formatFileSize: 文件大小格式化

2. **创建文件工具**（src/utils/file.ts）：
   - getFileExtension: 获取文件扩展名
   - getFileName: 获取文件名（不含扩展名）
   - isHiddenFile: 判断隐藏文件
   - getLanguageFromExtension: 根据扩展名获取语言
   - buildFilePath: 构建文件路径
   - findNodeByPath: 从文件树查找节点
   - flattenFileTree: 展平文件树

3. **创建 DAG 工具**（src/utils/dag.ts）：
   - topologicalSort: 拓扑排序
   - detectCyclicDependency: 检测循环依赖
   - groupTasksByLayer: 按层级分组
   - getAllDependencies: 获取所有依赖
   - calculateCriticalPath: 计算关键路径

4. **创建验证工具**（src/utils/validation.ts）：
   - isValidProjectName: 验证项目名
   - isValidFilePath: 验证文件路径
   - isValidUrl: 验证 URL
   - isValidEmail: 验证 Email
   - sanitizePath: 清理路径

5. **创建字符串工具**（src/utils/string.ts）：
   - truncate: 截断字符串
   - capitalize: 首字母大写
   - camelToKebab: 驼峰转连字符
   - kebabToCamel: 连字符转驼峰
   - generateId: 生成随机 ID

6. **统一导出**（src/utils/index.ts）：
   - 导出所有工具函数

7. **验证**：
   - 确保所有工具函数可以正常使用
   - TypeScript 类型正确
   - 无编译错误

确保工具函数健壮、易用，覆盖常见的业务场景。
