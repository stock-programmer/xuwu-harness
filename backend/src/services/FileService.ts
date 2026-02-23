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
