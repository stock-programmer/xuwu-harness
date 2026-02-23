import { httpClient } from './http-client';
import type { FileNode, FileContent } from '@/types/file.types';

export const fileApi = {
  // 获取文件树
  getFileTree: async (projectId: string, path = '/'): Promise<FileNode[]> => {
    console.log('[fileApi] getFileTree called:', { projectId, path });
    const response = await httpClient.get<{ success: boolean; data: { tree: FileNode[] } }>(
      `/api/projects/${projectId}/files/tree`,
      { params: { path } }
    );
    console.log('[fileApi] getFileTree response:', response);
    return response.data.tree;
  },

  // 获取文件内容
  getFileContent: async (projectId: string, filePath: string): Promise<FileContent> => {
    console.log('[fileApi] getFileContent called:', { projectId, filePath });
    const response = await httpClient.get<{ success: boolean; data: FileContent }>(
      `/api/projects/${projectId}/files/content`,
      { params: { path: filePath } }
    );
    console.log('[fileApi] getFileContent response:', response);
    return response.data;
  },

  // 创建文件
  createFile: (projectId: string, path: string, content: string): Promise<FileNode> =>
    httpClient.post(`/api/projects/${projectId}/files`, {
      path,
      content,
      type: 'file',
    }),

  // 创建目录
  createDirectory: (projectId: string, path: string): Promise<FileNode> =>
    httpClient.post(`/api/projects/${projectId}/files`, {
      path,
      type: 'directory',
    }),

  // 删除文件/目录
  deleteFile: (projectId: string, path: string): Promise<void> =>
    httpClient.delete(`/api/projects/${projectId}/files`, {
      params: { path },
    }),

  // 重命名文件/目录
  renameFile: (projectId: string, oldPath: string, newPath: string): Promise<FileNode> =>
    httpClient.put(`/api/projects/${projectId}/files/rename`, {
      oldPath,
      newPath,
    }),

  // 更新文件内容
  updateFileContent: async (projectId: string, path: string, content: string): Promise<void> => {
    console.log('[fileApi] updateFileContent called:', { projectId, path, contentLength: content.length });
    const response = await httpClient.post(`/api/projects/${projectId}/files/content`, {
      path,
      content,
    });
    console.log('[fileApi] updateFileContent response:', response);
  },

  // 移动文件/目录
  moveFile: (projectId: string, oldPath: string, newPath: string): Promise<FileNode> =>
    httpClient.put(`/api/projects/${projectId}/files/move`, {
      oldPath,
      newPath,
    }),

  // 复制文件/目录
  copyFile: (projectId: string, sourcePath: string, targetPath: string): Promise<FileNode> =>
    httpClient.post(`/api/projects/${projectId}/files/copy`, {
      sourcePath,
      targetPath,
    }),
};
