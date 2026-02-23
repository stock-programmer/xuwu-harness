import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { WorkMode, ModeStatus } from '@/types/mode.types';

interface ModeState extends ModeStatus {
  // Actions
  setMode: (mode: WorkMode) => void;
  addHistory: (mode: WorkMode, result: 'success' | 'failed' | 'skipped') => void;
  clearHistory: () => void;
  getNextMode: () => WorkMode | null;
}

const MODE_ORDER: WorkMode[] = [
  'prd',
  'architecture',
  'dev-plan',
  'task-gen',
  'task-exec',
  'loop-test',
  'deploy',
];

export const useModeStore = create<ModeState>()(
  devtools(
    persist(
      (set, get) => ({
        // 初始状态
        currentMode: 'prd',
        availableModes: MODE_ORDER,
        history: [],

        // 设置模式
        setMode: (mode) => {
          set({ currentMode: mode });
        },

        // 添加历史记录
        addHistory: (mode, result) => {
          set((state) => ({
            history: [
              ...state.history,
              {
                mode,
                timestamp: new Date().toISOString(),
                result,
              },
            ],
          }));
        },

        // 清空历史
        clearHistory: () => {
          set({ history: [] });
        },

        // 获取下一个模式
        getNextMode: () => {
          const { currentMode } = get();
          const currentIndex = MODE_ORDER.indexOf(currentMode);
          if (currentIndex < MODE_ORDER.length - 1) {
            return MODE_ORDER[currentIndex + 1];
          }
          return null;
        },
      }),
      {
        name: 'mode-storage',
        partialize: (state) => ({
          currentMode: state.currentMode,
          history: state.history,
        }),
      }
    ),
    { name: 'ModeStore' }
  )
);
