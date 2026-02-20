# Task: 配置 Zustand 状态管理

## 元数据
- **Task ID**: frontend-dev-plan-2.4
- **Layer**: 2
- **Dependencies**: [1.1]
- **Parallel Group**: [2.1, 2.2, 2.3, 2.4, 2.5, 2.6]
- **Estimated Complexity**: Medium

## 目标
安装 Zustand，创建 store 目录结构，实现基础 store（AppStore、ModeStore），配置 DevTools。

## 前置条件
- 项目已初始化（Task 1.1 完成）

## 实现步骤

### 1. 安装 Zustand
```bash
cd frontend
npm install zustand
```

### 2. 创建 store 目录结构
```bash
mkdir -p src/store
```

### 3. 创建 AppStore（应用全局状态）
创建 `src/store/useAppStore.ts`：
```typescript
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
```

### 4. 创建 ModeStore（工作模式状态）
创建 `src/store/useModeStore.ts`：
```typescript
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export enum WorkMode {
  PRD = 'prd',
  ARCHITECTURE = 'architecture',
  DEV_PLAN = 'dev_plan',
  TASK_GEN = 'task_gen',
  TASK_EXEC = 'task_exec',
  LOOP_TEST = 'loop_test',
  DEPLOY = 'deploy',
}

interface ModeState {
  currentMode: WorkMode;
  modeHistory: WorkMode[];
  progress: Record<WorkMode, number>;

  setMode: (mode: WorkMode) => void;
  goToNextMode: () => void;
  goToPrevMode: () => void;
  updateProgress: (mode: WorkMode, progress: number) => void;
  resetProgress: () => void;
}

const modeSequence: WorkMode[] = [
  WorkMode.PRD,
  WorkMode.ARCHITECTURE,
  WorkMode.DEV_PLAN,
  WorkMode.TASK_GEN,
  WorkMode.TASK_EXEC,
  WorkMode.LOOP_TEST,
  WorkMode.DEPLOY,
];

export const useModeStore = create<ModeState>()(
  devtools(
    (set, get) => ({
      currentMode: WorkMode.PRD,
      modeHistory: [WorkMode.PRD],
      progress: {
        [WorkMode.PRD]: 0,
        [WorkMode.ARCHITECTURE]: 0,
        [WorkMode.DEV_PLAN]: 0,
        [WorkMode.TASK_GEN]: 0,
        [WorkMode.TASK_EXEC]: 0,
        [WorkMode.LOOP_TEST]: 0,
        [WorkMode.DEPLOY]: 0,
      },

      setMode: (mode) =>
        set(
          (state) => ({
            currentMode: mode,
            modeHistory: [...state.modeHistory, mode],
          }),
          false,
          'setMode'
        ),

      goToNextMode: () => {
        const { currentMode } = get();
        const currentIndex = modeSequence.indexOf(currentMode);
        if (currentIndex >= 0 && currentIndex < modeSequence.length - 1) {
          get().setMode(modeSequence[currentIndex + 1]);
        }
      },

      goToPrevMode: () => {
        const { modeHistory } = get();
        if (modeHistory.length > 1) {
          const prevMode = modeHistory[modeHistory.length - 2];
          set(
            {
              currentMode: prevMode,
              modeHistory: modeHistory.slice(0, -1),
            },
            false,
            'goToPrevMode'
          );
        }
      },

      updateProgress: (mode, progress) =>
        set(
          (state) => ({
            progress: {
              ...state.progress,
              [mode]: progress,
            },
          }),
          false,
          'updateProgress'
        ),

      resetProgress: () =>
        set(
          {
            progress: {
              [WorkMode.PRD]: 0,
              [WorkMode.ARCHITECTURE]: 0,
              [WorkMode.DEV_PLAN]: 0,
              [WorkMode.TASK_GEN]: 0,
              [WorkMode.TASK_EXEC]: 0,
              [WorkMode.LOOP_TEST]: 0,
              [WorkMode.DEPLOY]: 0,
            },
          },
          false,
          'resetProgress'
        ),
    }),
    { name: 'ModeStore' }
  )
);
```

### 5. 创建 store 导出文件
创建 `src/store/index.ts`：
```typescript
export { useAppStore } from './useAppStore';
export { useModeStore, WorkMode } from './useModeStore';
```

### 6. 测试 store 使用
在 `src/App.tsx` 中测试：
```typescript
import { useAppStore } from '@/store';

function App() {
  const { theme, setTheme } = useAppStore();

  return (
    <div>
      <p>Current theme: {theme}</p>
      <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
        Toggle Theme
      </button>
    </div>
  );
}
```

## 期望输出
- ✅ `zustand` 安装成功
- ✅ `src/store/useAppStore.ts` 创建
- ✅ `src/store/useModeStore.ts` 创建
- ✅ `src/store/index.ts` 导出文件创建
- ✅ Store 可以正常使用
- ✅ DevTools 集成（可以在浏览器中查看状态）

## 验证标准
```typescript
// 在组件中使用
import { useAppStore, useModeStore } from '@/store';

const { theme, setTheme } = useAppStore();
const { currentMode, setMode } = useModeStore();

setTheme('dark'); // 应该能切换主题
setMode(WorkMode.ARCHITECTURE); // 应该能切换模式
```

## Claude 执行 Prompt

请为前端项目配置 Zustand 状态管理，具体要求如下：

1. **安装 Zustand**：
   - 安装 zustand 包

2. **创建目录结构**：
   - 创建 `src/store` 目录

3. **创建 AppStore**（src/store/useAppStore.ts）：
   - 管理全局 UI 状态：
     - sidebarCollapsed（侧边栏折叠状态）
     - theme（主题：light/dark）
     - user（用户信息）
   - 实现操作方法：
     - toggleSidebar
     - setSidebarCollapsed
     - setTheme
     - setUser
   - 集成 devtools 中间件

4. **创建 ModeStore**（src/store/useModeStore.ts）：
   - 定义 WorkMode 枚举（7 种模式）
   - 管理工作模式状态：
     - currentMode（当前模式）
     - modeHistory（模式历史）
     - progress（各模式进度）
   - 实现操作方法：
     - setMode
     - goToNextMode
     - goToPrevMode
     - updateProgress
     - resetProgress
   - 集成 devtools 中间件

5. **创建统一导出**（src/store/index.ts）：
   - 导出所有 store

6. **测试验证**：
   - 在 App.tsx 中测试使用 store
   - 确认状态可以正常读取和更新
   - 打开浏览器 DevTools 确认可以看到 Zustand 状态

确保所有 store 可以正常工作，TypeScript 类型完整，DevTools 可用。
