import { useOutputConsoleStore } from '../store/output-console.store';

/**
 * Add test logs to the output console for development purposes
 */
export const addTestLogs = () => {
  const { addLog } = useOutputConsoleStore.getState();

  addLog({
    level: 'info',
    message: '项目初始化成功',
    source: 'system',
  });

  addLog({
    level: 'info',
    message: '开始执行任务 DAG...',
    source: 'orchestrator',
  });

  addLog({
    level: 'warn',
    message: '检测到潜在的循环依赖',
    source: 'dag',
  });

  addLog({
    level: 'error',
    message: '任务 task-3.2 执行失败',
    source: 'executor',
    metadata: {
      taskId: 'task-3.2',
      error: 'Connection timeout',
    },
  });

  addLog({
    level: 'debug',
    message: 'WebSocket 连接已建立',
    source: 'websocket',
  });
};

/**
 * Add a continuous stream of test logs
 */
export const addStreamingTestLogs = () => {
  const { addLog } = useOutputConsoleStore.getState();
  let count = 0;

  const interval = setInterval(() => {
    count++;

    if (count % 4 === 0) {
      addLog({
        level: 'info',
        message: `Processing task ${count}...`,
        source: 'executor',
      });
    } else if (count % 4 === 1) {
      addLog({
        level: 'debug',
        message: `Debug info: Task ${count} details`,
        source: 'system',
      });
    } else if (count % 4 === 2) {
      addLog({
        level: 'warn',
        message: `Warning: Task ${count} is taking longer than expected`,
        source: 'monitor',
      });
    } else {
      addLog({
        level: 'error',
        message: `Error in task ${count}`,
        source: 'executor',
        metadata: { taskId: `task-${count}`, error: 'Test error' },
      });
    }

    if (count >= 20) {
      clearInterval(interval);
    }
  }, 500);

  return () => clearInterval(interval);
};
