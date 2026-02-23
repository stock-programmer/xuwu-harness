import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { OutputLog } from '@/types/execution.types';
import { generateId } from '@/utils/string';

interface OutputConsoleState {
  // State
  logs: OutputLog[];
  autoScroll: boolean;
  filter: 'all' | 'info' | 'warn' | 'error' | 'debug';
  maxLogs: number;

  // Actions
  addLog: (log: Omit<OutputLog, 'id' | 'timestamp'>) => void;
  addLogs: (logs: Omit<OutputLog, 'id' | 'timestamp'>[]) => void;
  clearLogs: () => void;
  setAutoScroll: (enabled: boolean) => void;
  setFilter: (filter: OutputConsoleState['filter']) => void;
  getFilteredLogs: () => OutputLog[];
}

export const useOutputConsoleStore = create<OutputConsoleState>()(
  devtools(
    (set, get) => ({
      // Initial state
      logs: [],
      autoScroll: true,
      filter: 'all',
      maxLogs: 1000,

      // Add single log
      addLog: (log) => {
        set((state) => {
          const newLog: OutputLog = {
            id: generateId('log'),
            timestamp: new Date().toISOString(),
            ...log,
          };

          const newLogs = [...state.logs, newLog];

          // Limit log count
          if (newLogs.length > state.maxLogs) {
            return { logs: newLogs.slice(-state.maxLogs) };
          }

          return { logs: newLogs };
        });
      },

      // Add multiple logs
      addLogs: (logs) => {
        set((state) => {
          const newLogs = logs.map((log) => ({
            id: generateId('log'),
            timestamp: new Date().toISOString(),
            ...log,
          }));

          const allLogs = [...state.logs, ...newLogs];

          // Limit log count
          if (allLogs.length > state.maxLogs) {
            return { logs: allLogs.slice(-state.maxLogs) };
          }

          return { logs: allLogs };
        });
      },

      // Clear logs
      clearLogs: () => set({ logs: [] }),

      // Set auto scroll
      setAutoScroll: (enabled) => set({ autoScroll: enabled }),

      // Set filter
      setFilter: (filter) => set({ filter }),

      // Get filtered logs
      getFilteredLogs: () => {
        const { logs, filter } = get();
        if (filter === 'all') return logs;
        return logs.filter((log) => log.level === filter);
      },
    }),
    { name: 'OutputConsoleStore' }
  )
);
