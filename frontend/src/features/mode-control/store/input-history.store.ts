import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { WorkMode } from '@/types/mode.types';

interface HistoryEntry {
  id: string;
  mode: WorkMode;
  prompt: string;
  timestamp: string;
}

interface InputHistoryState {
  // 状态
  history: HistoryEntry[];
  currentIndex: number;
  maxHistory: number;

  // Actions
  addHistory: (mode: WorkMode, prompt: string) => void;
  getHistory: (mode?: WorkMode) => HistoryEntry[];
  clearHistory: () => void;
  navigatePrevious: () => string | null;
  navigateNext: () => string | null;
  resetNavigation: () => void;
}

export const useInputHistoryStore = create<InputHistoryState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        history: [],
        currentIndex: -1,
        maxHistory: 50,

        // 添加历史记录
        addHistory: (mode, prompt) => {
          if (!prompt.trim()) return;

          set((state) => {
            const newEntry: HistoryEntry = {
              id: `${Date.now()}_${Math.random().toString(36).substring(7)}`,
              mode,
              prompt,
              timestamp: new Date().toISOString(),
            };

            const newHistory = [...state.history, newEntry];

            // 限制历史记录数量
            if (newHistory.length > state.maxHistory) {
              newHistory.shift();
            }

            return {
              history: newHistory,
              currentIndex: -1, // 重置导航索引
            };
          });
        },

        // 获取历史记录（可按模式过滤）
        getHistory: (mode) => {
          const { history } = get();
          if (!mode) return history;
          return history.filter((entry) => entry.mode === mode);
        },

        // 清空历史记录
        clearHistory: () => {
          set({ history: [], currentIndex: -1 });
        },

        // 导航到上一条（按上箭头）
        navigatePrevious: () => {
          const { history, currentIndex } = get();
          if (history.length === 0) return null;

          const newIndex = currentIndex < history.length - 1 ? currentIndex + 1 : currentIndex;

          set({ currentIndex: newIndex });

          return history[history.length - 1 - newIndex]?.prompt || null;
        },

        // 导航到下一条（按下箭头）
        navigateNext: () => {
          const { history, currentIndex } = get();
          if (currentIndex <= 0) {
            set({ currentIndex: -1 });
            return '';
          }

          const newIndex = currentIndex - 1;
          set({ currentIndex: newIndex });

          return history[history.length - 1 - newIndex]?.prompt || '';
        },

        // 重置导航索引
        resetNavigation: () => {
          set({ currentIndex: -1 });
        },
      }),
      {
        name: 'input-history-storage',
        partialize: (state) => ({
          history: state.history,
        }),
      }
    ),
    { name: 'InputHistoryStore' }
  )
);
