import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { TaskNode, TaskMetadata, TaskResult, LayerInfo } from '@/types/task.types';
import type { ExecutionProgress, ExecutionStatus, TaskStatus } from '@/types/execution.types';

interface TaskExecutionState {
  // 状态
  tasks: TaskNode[];
  layers: Map<number, LayerInfo>;
  currentLayer: number;
  currentTaskId: string | null;
  executionStatus: ExecutionStatus;
  progress: ExecutionProgress | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadTasks: (tasks: TaskMetadata[]) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus, result?: Partial<TaskResult>) => void;
  setCurrentTask: (taskId: string | null) => void;
  setExecutionStatus: (status: ExecutionStatus) => void;
  updateProgress: (progress: ExecutionProgress) => void;
  moveToNextLayer: () => void;
  reset: () => void;
  getTaskById: (taskId: string) => TaskNode | undefined;
  getTasksByLayer: (layer: number) => TaskNode[];
  getCompletedTasksCount: () => number;
}

export const useTaskExecutionStore = create<TaskExecutionState>()(
  devtools(
    (set, get) => ({
      // 初始状态
      tasks: [],
      layers: new Map(),
      currentLayer: 1,
      currentTaskId: null,
      executionStatus: 'idle',
      progress: null,
      loading: false,
      error: null,

      // 加载任务
      loadTasks: (taskMetadataList) => {
        const tasks: TaskNode[] = taskMetadataList.map((metadata) => ({
          id: metadata.id,
          metadata,
          status: 'pending',
          dependencies: metadata.dependencies,
          dependents: [],
        }));

        // 计算 dependents
        tasks.forEach((task) => {
          task.dependencies.forEach((depId) => {
            const depTask = tasks.find((t) => t.id === depId);
            if (depTask) {
              depTask.dependents.push(task.id);
            }
          });
        });

        // 按 Layer 分组
        const layerMap = new Map<number, LayerInfo>();
        taskMetadataList.forEach((metadata) => {
          if (!layerMap.has(metadata.layer)) {
            layerMap.set(metadata.layer, {
              layerNum: metadata.layer,
              dependsOn: [],
              parallel: true,
              tasks: [],
              completedTasks: 0,
              totalTasks: 0,
            });
          }
          const layerInfo = layerMap.get(metadata.layer)!;
          layerInfo.tasks.push(metadata);
          layerInfo.totalTasks += 1;
        });

        set({ tasks, layers: layerMap, loading: false });
      },

      // 更新任务状态
      updateTaskStatus: (taskId, status, result) => {
        set((state) => {
          const tasks = state.tasks.map((task) => {
            if (task.id === taskId) {
              return {
                ...task,
                status,
                result: result
                  ? {
                      taskId,
                      status,
                      startTime: result.startTime || new Date().toISOString(),
                      endTime: result.endTime,
                      duration: result.duration,
                      output: result.output,
                      error: result.error,
                      retryCount: result.retryCount || 0,
                    }
                  : task.result,
              };
            }
            return task;
          });

          // 更新 Layer 完成计数
          const layers = new Map(state.layers);
          const task = tasks.find((t) => t.id === taskId);
          if (task && status === 'completed') {
            const layerInfo = layers.get(task.metadata.layer);
            if (layerInfo) {
              layerInfo.completedTasks += 1;
              layers.set(task.metadata.layer, layerInfo);
            }
          }

          return { tasks, layers };
        });
      },

      // 设置当前任务
      setCurrentTask: (taskId) => {
        set({ currentTaskId: taskId });
      },

      // 设置执行状态
      setExecutionStatus: (status) => {
        set({ executionStatus: status });
      },

      // 更新进度
      updateProgress: (progress) => {
        set({ progress });
      },

      // 移动到下一层
      moveToNextLayer: () => {
        set((state) => ({
          currentLayer: state.currentLayer + 1,
        }));
      },

      // 重置
      reset: () => {
        set({
          tasks: [],
          layers: new Map(),
          currentLayer: 1,
          currentTaskId: null,
          executionStatus: 'idle',
          progress: null,
          loading: false,
          error: null,
        });
      },

      // 根据 ID 获取任务
      getTaskById: (taskId) => {
        return get().tasks.find((t) => t.id === taskId);
      },

      // 获取指定 Layer 的任务
      getTasksByLayer: (layer) => {
        return get().tasks.filter((t) => t.metadata.layer === layer);
      },

      // 获取已完成任务数量
      getCompletedTasksCount: () => {
        return get().tasks.filter((t) => t.status === 'completed').length;
      },
    }),
    { name: 'TaskExecutionStore' }
  )
);
