import { useCallback } from 'react';
import { message } from 'antd';
import { useFileExplorerStore } from '../store/file-explorer.store';
import { fileApi } from '@/services/api/file.api';

export const useFileExplorer = (projectId: string) => {
  const { refreshTree } = useFileExplorerStore();

  const createFile = useCallback(
    async (path: string, content = '') => {
      try {
        await fileApi.createFile(projectId, path, content);
        message.success('文件创建成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '文件创建失败');
      }
    },
    [projectId, refreshTree]
  );

  const createDirectory = useCallback(
    async (path: string) => {
      try {
        await fileApi.createDirectory(projectId, path);
        message.success('目录创建成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '目录创建失败');
      }
    },
    [projectId, refreshTree]
  );

  const deleteFile = useCallback(
    async (path: string) => {
      try {
        await fileApi.deleteFile(projectId, path);
        message.success('删除成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '删除失败');
      }
    },
    [projectId, refreshTree]
  );

  const renameFile = useCallback(
    async (oldPath: string, newPath: string) => {
      try {
        await fileApi.renameFile(projectId, oldPath, newPath);
        message.success('重命名成功');
        await refreshTree(projectId);
      } catch (error: any) {
        message.error(error.message || '重命名失败');
      }
    },
    [projectId, refreshTree]
  );

  return {
    createFile,
    createDirectory,
    deleteFile,
    renameFile,
  };
};
