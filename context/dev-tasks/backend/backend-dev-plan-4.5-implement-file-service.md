# Task: 实现 File Service（文件服务）

## 元数据
- **Task ID**: backend-4.5
- **Layer**: 4
- **Dependencies**: [2.6]
- **Parallel Group**: [4.1, 4.2, 4.3, 4.4, 4.5]
- **Estimated Complexity**: Medium

## 目标
实现文件操作服务，提供文件 CRUD、文件树构建、文件搜索等功能。

## 前置条件
- 文件系统监控已实现（Task 2.6）

## 实现步骤

### 1. 创建 File Service
创建 `src/services/FileService.ts`：
```typescript
import fs from 'fs/promises';
import path from 'path';
import logger from '@/utils/logger';

export interface FileNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  size?: number;
  modifiedAt?: Date;
}

export class FileService {
  /**
   * 构建文件树
   */
  async buildFileTree(rootPath: string, maxDepth: number = 5): Promise<FileNode> {
    const stats = await fs.stat(rootPath);
    const name = path.basename(rootPath);

    if (!stats.isDirectory()) {
      return {
        name,
        path: rootPath,
        type: 'file',
        size: stats.size,
        modifiedAt: stats.mtime,
      };
    }

    if (maxDepth === 0) {
      return {
        name,
        path: rootPath,
        type: 'directory',
        children: [],
      };
    }

    const entries = await fs.readdir(rootPath, { withFileTypes: true });
    const children: FileNode[] = [];

    for (const entry of entries) {
      // 忽略隐藏文件和特定目录
      if (entry.name.startsWith('.') || entry.name === 'node_modules') {
        continue;
      }

      const fullPath = path.join(rootPath, entry.name);
      const child = await this.buildFileTree(fullPath, maxDepth - 1);
      children.push(child);
    }

    return {
      name,
      path: rootPath,
      type: 'directory',
      children,
    };
  }

  /**
   * 读取文件
   */
  async readFile(filePath: string): Promise<string> {
    return await fs.readFile(filePath, 'utf-8');
  }

  /**
   * 写入文件
   */
  async writeFile(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, content, 'utf-8');
  }

  /**
   * 删除文件
   */
  async deleteFile(filePath: string): Promise<void> {
    await fs.unlink(filePath);
  }
}

export const fileService = new FileService();
```

## 验证标准

测试文件树构建、文件读写、删除功能。

## Claude 执行 Prompt

请实现 FileService：构建文件树、读写文件、删除文件、忽略规则。
