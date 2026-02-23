import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AppState {
  // UI 状态
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark';

  // 用户状态
  user: User | null;

  // 操作
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setUser: (user: User | null) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    (set) => ({
      // 初始状态
      sidebarCollapsed: false,
      theme: 'light',
      user: null,

      // 操作
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }), false, 'toggleSidebar'),

      setSidebarCollapsed: (collapsed) =>
        set({ sidebarCollapsed: collapsed }, false, 'setSidebarCollapsed'),

      setTheme: (theme) => set({ theme }, false, 'setTheme'),

      setUser: (user) => set({ user }, false, 'setUser'),
    }),
    { name: 'AppStore' }
  )
);
