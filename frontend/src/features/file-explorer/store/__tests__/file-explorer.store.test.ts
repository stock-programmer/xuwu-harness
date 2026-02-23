import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFileExplorerStore } from '../file-explorer.store';
import { fileApi } from '@/services/api/file.api';
import type { FileNode } from '@/types/file.types';

// Mock the file API
vi.mock('@/services/api/file.api', () => ({
  fileApi: {
    getFileTree: vi.fn(),
  },
}));

describe('file-explorer.store', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { reset } = useFileExplorerStore.getState();
    reset();
    vi.clearAllMocks();
  });

  const mockFileTree: FileNode[] = [
    {
      id: 'dir-1',
      name: 'src',
      path: '/src',
      type: 'directory',
      children: [
        {
          id: 'file-1',
          name: 'index.ts',
          path: '/src/index.ts',
          type: 'file',
          size: 1024,
        },
      ],
    },
    {
      id: 'file-2',
      name: 'README.md',
      path: '/README.md',
      type: 'file',
      size: 512,
    },
  ];

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useFileExplorerStore.getState();

      expect(state.fileTree).toEqual([]);
      expect(state.selectedFile).toBeNull();
      expect(state.expandedKeys).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('loadFileTree', () => {
    it('should load file tree successfully', async () => {
      vi.mocked(fileApi.getFileTree).mockResolvedValue(mockFileTree);

      const { loadFileTree } = useFileExplorerStore.getState();
      await loadFileTree('project-1');

      const state = useFileExplorerStore.getState();
      expect(state.fileTree).toEqual(mockFileTree);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
      expect(fileApi.getFileTree).toHaveBeenCalledWith('project-1', '/');
    });

    it('should set loading state during fetch', async () => {
      vi.mocked(fileApi.getFileTree).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve(mockFileTree), 100))
      );

      const { loadFileTree } = useFileExplorerStore.getState();
      const promise = loadFileTree('project-1');

      // Check loading state immediately
      expect(useFileExplorerStore.getState().loading).toBe(true);

      await promise;

      // Check loading state after completion
      expect(useFileExplorerStore.getState().loading).toBe(false);
    });

    it('should handle errors', async () => {
      const error = new Error('Failed to load file tree');
      vi.mocked(fileApi.getFileTree).mockRejectedValue(error);

      const { loadFileTree } = useFileExplorerStore.getState();
      await loadFileTree('project-1');

      const state = useFileExplorerStore.getState();
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Failed to load file tree');
      expect(state.fileTree).toEqual([]);
    });

    it('should use custom path when provided', async () => {
      vi.mocked(fileApi.getFileTree).mockResolvedValue(mockFileTree);

      const { loadFileTree } = useFileExplorerStore.getState();
      await loadFileTree('project-1', '/custom/path');

      expect(fileApi.getFileTree).toHaveBeenCalledWith('project-1', '/custom/path');
    });
  });

  describe('selectFile', () => {
    it('should select a file', () => {
      const file: FileNode = {
        id: 'file-1',
        name: 'test.ts',
        path: '/test.ts',
        type: 'file',
        size: 1024,
      };

      const { selectFile } = useFileExplorerStore.getState();
      selectFile(file);

      const state = useFileExplorerStore.getState();
      expect(state.selectedFile).toEqual(file);
    });

    it('should allow deselecting by passing null', () => {
      const file: FileNode = {
        id: 'file-1',
        name: 'test.ts',
        path: '/test.ts',
        type: 'file',
        size: 1024,
      };

      const { selectFile } = useFileExplorerStore.getState();
      selectFile(file);
      expect(useFileExplorerStore.getState().selectedFile).toEqual(file);

      selectFile(null);
      expect(useFileExplorerStore.getState().selectedFile).toBeNull();
    });
  });

  describe('toggleExpand', () => {
    it('should expand a collapsed node', () => {
      const { toggleExpand } = useFileExplorerStore.getState();
      toggleExpand('node-1');

      const state = useFileExplorerStore.getState();
      expect(state.expandedKeys).toContain('node-1');
    });

    it('should collapse an expanded node', () => {
      const { toggleExpand, expandNode } = useFileExplorerStore.getState();

      // First expand the node
      expandNode('node-1');
      expect(useFileExplorerStore.getState().expandedKeys).toContain('node-1');

      // Then toggle to collapse
      toggleExpand('node-1');
      expect(useFileExplorerStore.getState().expandedKeys).not.toContain('node-1');
    });

    it('should toggle multiple nodes independently', () => {
      const { toggleExpand } = useFileExplorerStore.getState();

      toggleExpand('node-1');
      toggleExpand('node-2');

      const state = useFileExplorerStore.getState();
      expect(state.expandedKeys).toContain('node-1');
      expect(state.expandedKeys).toContain('node-2');

      toggleExpand('node-1');
      const updatedState = useFileExplorerStore.getState();
      expect(updatedState.expandedKeys).not.toContain('node-1');
      expect(updatedState.expandedKeys).toContain('node-2');
    });
  });

  describe('expandNode', () => {
    it('should expand a node', () => {
      const { expandNode } = useFileExplorerStore.getState();
      expandNode('node-1');

      const state = useFileExplorerStore.getState();
      expect(state.expandedKeys).toContain('node-1');
    });

    it('should not duplicate expanded keys', () => {
      const { expandNode } = useFileExplorerStore.getState();

      expandNode('node-1');
      expandNode('node-1');

      const state = useFileExplorerStore.getState();
      expect(state.expandedKeys.filter((key) => key === 'node-1')).toHaveLength(1);
    });
  });

  describe('collapseNode', () => {
    it('should collapse an expanded node', () => {
      const { expandNode, collapseNode } = useFileExplorerStore.getState();

      expandNode('node-1');
      expect(useFileExplorerStore.getState().expandedKeys).toContain('node-1');

      collapseNode('node-1');
      expect(useFileExplorerStore.getState().expandedKeys).not.toContain('node-1');
    });

    it('should do nothing if node is not expanded', () => {
      const { collapseNode } = useFileExplorerStore.getState();

      collapseNode('node-1');
      const state = useFileExplorerStore.getState();
      expect(state.expandedKeys).toEqual([]);
    });
  });

  describe('refreshTree', () => {
    it('should reload file tree', async () => {
      vi.mocked(fileApi.getFileTree).mockResolvedValue(mockFileTree);

      const { refreshTree } = useFileExplorerStore.getState();
      await refreshTree('project-1');

      const state = useFileExplorerStore.getState();
      expect(state.fileTree).toEqual(mockFileTree);
      expect(fileApi.getFileTree).toHaveBeenCalledWith('project-1', '/');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', async () => {
      vi.mocked(fileApi.getFileTree).mockResolvedValue(mockFileTree);

      const { loadFileTree, selectFile, expandNode, reset } = useFileExplorerStore.getState();

      // Modify state
      await loadFileTree('project-1');
      selectFile(mockFileTree[0]);
      expandNode('node-1');

      // Verify state is modified
      let state = useFileExplorerStore.getState();
      expect(state.fileTree).toEqual(mockFileTree);
      expect(state.selectedFile).not.toBeNull();
      expect(state.expandedKeys).toHaveLength(1);

      // Reset
      reset();

      // Verify state is reset
      state = useFileExplorerStore.getState();
      expect(state.fileTree).toEqual([]);
      expect(state.selectedFile).toBeNull();
      expect(state.expandedKeys).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });
});
