import { sequelize } from '@/config/database';
import { Project, TaskExecution, LayerExecution } from '@/models';
import { WebSocketServer, WebSocketManager, ProgressTracker } from '@/services';
import logger from '@/utils/logger';
import * as http from 'http';

/**
 * 测试 ProgressTracker
 */
async function testProgressTracker(): Promise<void> {
  logger.info('=== Testing ProgressTracker ===');

  try {
    // 1. 初始化数据库
    await sequelize.sync({ force: false });
    logger.info('✓ Database synchronized');

    // 2. 创建测试项目
    const project = await Project.create({
      name: 'Test Project',
      type: 'backend',
      root_path: '/test/path',
      status: 'active',
    });
    logger.info(`✓ Created test project: ${project.id}`);

    // 3. 创建测试层级
    const layer0 = await LayerExecution.create({
      project_id: project.id,
      layer_num: 0,
      total_tasks: 3,
      status: 'pending',
    });

    const layer1 = await LayerExecution.create({
      project_id: project.id,
      layer_num: 1,
      total_tasks: 2,
      status: 'pending',
    });
    logger.info('✓ Created test layers');

    // 4. 创建测试任务
    const tasks = [
      { task_id: '0.1', layer_num: 0 },
      { task_id: '0.2', layer_num: 0 },
      { task_id: '0.3', layer_num: 0 },
      { task_id: '1.1', layer_num: 1 },
      { task_id: '1.2', layer_num: 1 },
    ];

    for (const task of tasks) {
      await TaskExecution.create({
        project_id: project.id,
        task_id: task.task_id,
        layer_num: task.layer_num,
        task_file: `task-${task.task_id}.md`,
        task_name: `Test Task ${task.task_id}`,
        status: 'pending',
      });
    }
    logger.info(`✓ Created ${tasks.length} test tasks`);

    // 5. 初始化 WebSocket 服务器和 ProgressTracker
    const httpServer = http.createServer();
    const wsServer = new WebSocketServer(httpServer);
    const wsManager = new WebSocketManager(wsServer);
    const progressTracker = new ProgressTracker(wsManager);
    logger.info('✓ Initialized WebSocket and ProgressTracker');

    // 6. 测试获取初始进度
    logger.info('\n--- Test 1: Get initial progress ---');
    const initialProgress = await progressTracker.getProgress(project.id);
    logger.info('Initial progress:', initialProgress);
    console.log('Initial progress:', JSON.stringify(initialProgress, null, 2));

    // 验证初始进度
    if (
      initialProgress.totalTasks === 5 &&
      initialProgress.completedTasks === 0 &&
      initialProgress.percentage === 0
    ) {
      logger.info('✓ Initial progress is correct');
    } else {
      logger.error('✗ Initial progress is incorrect');
    }

    // 7. 测试更新任务进度
    logger.info('\n--- Test 2: Update task progress ---');
    await progressTracker.updateTaskProgress(project.id, '0.1', 'running');
    let currentProgress = await progressTracker.getProgress(project.id);
    logger.info('Progress after starting task 0.1:', currentProgress);
    console.log('Current task:', currentProgress.currentTask);
    console.log('Task status:', currentProgress.taskStatus);

    await progressTracker.updateTaskProgress(project.id, '0.1', 'completed');
    currentProgress = await progressTracker.getProgress(project.id);
    logger.info('Progress after completing task 0.1:', currentProgress);
    console.log('Completed tasks:', currentProgress.completedTasks);
    console.log('Percentage:', currentProgress.percentage);

    if (
      currentProgress.completedTasks === 1 &&
      currentProgress.percentage === 20
    ) {
      logger.info('✓ Task progress update is correct (20%)');
    } else {
      logger.error('✗ Task progress update is incorrect');
    }

    // 8. 测试完成更多任务
    logger.info('\n--- Test 3: Complete more tasks ---');
    await progressTracker.updateTaskProgress(project.id, '0.2', 'running');
    await progressTracker.updateTaskProgress(project.id, '0.2', 'completed');
    await progressTracker.updateTaskProgress(project.id, '0.3', 'running');
    await progressTracker.updateTaskProgress(project.id, '0.3', 'completed');

    currentProgress = await progressTracker.getProgress(project.id);
    logger.info('Progress after completing layer 0:', currentProgress);
    console.log('Completed tasks:', currentProgress.completedTasks);
    console.log('Percentage:', currentProgress.percentage);

    if (
      currentProgress.completedTasks === 3 &&
      currentProgress.percentage === 60
    ) {
      logger.info('✓ Multiple task updates are correct (60%)');
    } else {
      logger.error('✗ Multiple task updates are incorrect');
    }

    // 9. 测试更新层级进度
    logger.info('\n--- Test 4: Update layer progress ---');
    await progressTracker.updateLayerProgress(project.id, 0, 'completed');

    const updatedLayer = await LayerExecution.findOne({
      where: { project_id: project.id, layer_num: 0 },
    });

    logger.info('Layer 0 after update:', {
      status: updatedLayer?.status,
      completedTasks: updatedLayer?.completed_tasks,
      failedTasks: updatedLayer?.failed_tasks,
    });

    if (
      updatedLayer?.status === 'completed' &&
      updatedLayer?.completed_tasks === 3 &&
      updatedLayer?.failed_tasks === 0
    ) {
      logger.info('✓ Layer progress update is correct');
    } else {
      logger.error('✗ Layer progress update is incorrect');
    }

    // 10. 测试任务失败场景
    logger.info('\n--- Test 5: Handle task failure ---');
    await progressTracker.updateTaskProgress(project.id, '1.1', 'running');
    await progressTracker.updateTaskProgress(project.id, '1.1', 'failed');

    currentProgress = await progressTracker.getProgress(project.id);
    logger.info('Progress after task failure:', currentProgress);
    console.log('Completed tasks:', currentProgress.completedTasks);
    console.log('Percentage:', currentProgress.percentage);

    // 失败的任务不应该计入完成任务
    if (currentProgress.completedTasks === 3) {
      logger.info('✓ Failed tasks are not counted as completed');
    } else {
      logger.error('✗ Failed task handling is incorrect');
    }

    // 11. 测试重置进度
    logger.info('\n--- Test 6: Reset progress ---');
    await progressTracker.resetProgress(project.id);

    const resetProgress = await progressTracker.getProgress(project.id);
    logger.info('Progress after reset:', resetProgress);
    console.log('Reset progress:', JSON.stringify(resetProgress, null, 2));

    if (
      resetProgress.completedTasks === 0 &&
      resetProgress.percentage === 0
    ) {
      logger.info('✓ Progress reset is correct');
    } else {
      logger.error('✗ Progress reset is incorrect');
    }

    // 12. 清理测试数据
    logger.info('\n--- Cleanup ---');
    await TaskExecution.destroy({ where: { project_id: project.id } });
    await LayerExecution.destroy({ where: { project_id: project.id } });
    await project.destroy();
    logger.info('✓ Test data cleaned up');

    logger.info('\n=== ProgressTracker Test Completed Successfully ===');
  } catch (error) {
    logger.error('Test failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 运行测试
testProgressTracker()
  .then(() => {
    logger.info('All tests passed!');
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Tests failed:', error);
    process.exit(1);
  });
