import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { FileNode } from '@/types/file.types';
import { fileApi } from '@/services/api/file.api';

interface FileExplorerState {
  // 状态
  fileTree: FileNode[];
  selectedFile: FileNode | null;
  expandedKeys: string[];
  loading: boolean;
  error: string | null;

  // Actions
  loadFileTree: (projectId: string, path?: string) => Promise<void>;
  selectFile: (file: FileNode | null) => void;
  toggleExpand: (nodeId: string) => void;
  expandNode: (nodeId: string) => void;
  collapseNode: (nodeId: string) => void;
  refreshTree: (projectId: string) => Promise<void>;
  reset: () => void;
}

export const useFileExplorerStore = create<FileExplorerState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      fileTree: [],
      selectedFile: null,
      expandedKeys: [],
      loading: false,
      error: null,

      // 加载文件树
      loadFileTree: async (projectId, path = '/') => {
        set({ loading: true, error: null });
        try {
          const response: any = await fileApi.getFileTree(projectId, path);
          // 后端返回格式: { success: true, data: { tree: [...], root: "..." } }
          const tree = response?.data?.tree || response?.tree || response || [];
          set({ fileTree: Array.isArray(tree) ? tree : [], loading: false });
        } catch (error: any) {
          set({
            error: error.message || '加载文件树失败',
            loading: false,
            fileTree: [], // 确保错误时也设置为空数组
          });
        }
      },

      // 选择文件
      selectFile: (file) => {
        set({ selectedFile: file });
      },

      // 切换展开/折叠
      toggleExpand: (nodeId) => {
        const { expandedKeys } = get();
        const newExpandedKeys = expandedKeys.includes(nodeId)
          ? expandedKeys.filter((key) => key !== nodeId)
          : [...expandedKeys, nodeId];
        set({ expandedKeys: newExpandedKeys });
      },

      // 展开节点
      expandNode: (nodeId) => {
        const { expandedKeys } = get();
        if (!expandedKeys.includes(nodeId)) {
          set({ expandedKeys: [...expandedKeys, nodeId] });
        }
      },

      // 折叠节点
      collapseNode: (nodeId) => {
        const { expandedKeys } = get();
        set({ expandedKeys: expandedKeys.filter((key) => key !== nodeId) });
      },

      // 刷新文件树
      refreshTree: async (projectId) => {
        await get().loadFileTree(projectId);
      },

      // 重置状态
      reset: () => {
        set({
          fileTree: [],
          selectedFile: null,
          expandedKeys: [],
          loading: false,
          error: null,
        });
      },
    }),
    { name: 'FileExplorerStore' }
  )
);
