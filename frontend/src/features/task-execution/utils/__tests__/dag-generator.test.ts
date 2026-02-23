import { describe, it, expect } from 'vitest';
import { generateMermaidDAG, generateDAGFromIndex } from '../dag-generator';
import type { TaskNode } from '@/types/task.types';

describe('dag-generator', () => {
  const createMockTask = (
    id: string,
    name: string,
    status: string,
    dependencies: string[] = []
  ): TaskNode => ({
    id,
    metadata: {
      id,
      name,
      description: `Description for ${name}`,
      layer: 1,
      dependencies,
      estimatedComplexity: 'Medium' as const,
    },
    status: status as any,
    dependencies,
    dependents: [],
  });

  describe('generateMermaidDAG', () => {
    it('should generate basic Mermaid DAG with single task', () => {
      const tasks = [createMockTask('task-1', 'Task 1', 'pending')];
      const result = generateMermaidDAG(tasks);

      expect(result).toContain('graph TD');
      expect(result).toContain('task_1["Task 1<br/>pending"]');
    });

    it('should generate DAG with multiple tasks', () => {
      const tasks = [
        createMockTask('task-1', 'Task 1', 'completed'),
        createMockTask('task-2', 'Task 2', 'running'),
        createMockTask('task-3', 'Task 3', 'pending'),
      ];
      const result = generateMermaidDAG(tasks);

      expect(result).toContain('task_1["Task 1<br/>completed"]');
      expect(result).toContain('task_2["Task 2<br/>running"]');
      expect(result).toContain('task_3["Task 3<br/>pending"]');
    });

    it('should generate dependency relationships', () => {
      const tasks = [
        createMockTask('task-1', 'Task 1', 'completed'),
        createMockTask('task-2', 'Task 2', 'running', ['task-1']),
        createMockTask('task-3', 'Task 3', 'pending', ['task-1', 'task-2']),
      ];
      const result = generateMermaidDAG(tasks);

      expect(result).toContain('task_1 --> task_2');
      expect(result).toContain('task_1 --> task_3');
      expect(result).toContain('task_2 --> task_3');
    });

    it('should include status styles by default', () => {
      const tasks = [createMockTask('task-1', 'Task 1', 'pending')];
      const result = generateMermaidDAG(tasks);

      expect(result).toContain('classDef pending');
      expect(result).toContain('classDef running');
      expect(result).toContain('classDef completed');
      expect(result).toContain('classDef failed');
      expect(result).toContain('classDef skipped');
    });

    it('should exclude status when showStatus is false', () => {
      const tasks = [createMockTask('task-1', 'Task 1', 'pending')];
      const result = generateMermaidDAG(tasks, { showStatus: false });

      expect(result).toContain('task_1["Task 1"]');
      expect(result).not.toContain('pending');
      expect(result).not.toContain('classDef');
    });

    it('should highlight specified tasks', () => {
      const tasks = [
        createMockTask('task-1', 'Task 1', 'completed'),
        createMockTask('task-2', 'Task 2', 'running'),
      ];
      const result = generateMermaidDAG(tasks, { highlightPath: ['task-1'] });

      expect(result).toContain(':::highlighted');
      expect(result).toContain('classDef highlighted');
    });

    it('should replace special characters in task IDs', () => {
      const tasks = [createMockTask('task.1-2', 'Task 1.2', 'pending')];
      const result = generateMermaidDAG(tasks);

      expect(result).toContain('task_1_2["Task 1.2<br/>pending"]');
    });

    it('should handle empty task list', () => {
      const result = generateMermaidDAG([]);

      expect(result).toContain('graph TD');
      expect(result).toContain('classDef');
    });

    it('should apply correct status styles', () => {
      const tasks = [
        createMockTask('task-1', 'Pending Task', 'pending'),
        createMockTask('task-2', 'Running Task', 'running'),
        createMockTask('task-3', 'Completed Task', 'completed'),
        createMockTask('task-4', 'Failed Task', 'failed'),
        createMockTask('task-5', 'Skipped Task', 'skipped'),
      ];
      const result = generateMermaidDAG(tasks);

      expect(result).toContain(':::pending');
      expect(result).toContain(':::running');
      expect(result).toContain(':::completed');
      expect(result).toContain(':::failed');
      expect(result).toContain(':::skipped');
    });
  });

  describe('generateDAGFromIndex', () => {
    it('should generate DAG from tasks index', () => {
      const tasksIndex = {
        layers: {
          layer1: {
            layer_num: 1,
            tasks: [
              { id: 'task-1', name: 'Task 1', dependencies: [] },
              { id: 'task-2', name: 'Task 2', dependencies: ['task-1'] },
            ],
          },
        },
      };

      const result = generateDAGFromIndex(tasksIndex);

      expect(result).toContain('graph TD');
      expect(result).toContain('task_1["Task 1"]');
      expect(result).toContain('task_2["Task 2"]');
      expect(result).toContain('task_1 --> task_2');
    });

    it('should apply layer styles', () => {
      const tasksIndex = {
        layers: {
          layer1: {
            layer_num: 1,
            tasks: [{ id: 'task-1', name: 'Task 1', dependencies: [] }],
          },
          layer2: {
            layer_num: 2,
            tasks: [{ id: 'task-2', name: 'Task 2', dependencies: ['task-1'] }],
          },
        },
      };

      const result = generateDAGFromIndex(tasksIndex);

      expect(result).toContain(':::layer1');
      expect(result).toContain(':::layer2');
      expect(result).toContain('classDef layer1');
      expect(result).toContain('classDef layer2');
    });

    it('should handle multiple tasks per layer', () => {
      const tasksIndex = {
        layers: {
          layer1: {
            layer_num: 1,
            tasks: [
              { id: 'task-1', name: 'Task 1', dependencies: [] },
              { id: 'task-2', name: 'Task 2', dependencies: [] },
              { id: 'task-3', name: 'Task 3', dependencies: [] },
            ],
          },
        },
      };

      const result = generateDAGFromIndex(tasksIndex);

      expect(result).toContain('task_1["Task 1"]');
      expect(result).toContain('task_2["Task 2"]');
      expect(result).toContain('task_3["Task 3"]');
    });

    it('should handle complex dependency chains', () => {
      const tasksIndex = {
        layers: {
          layer1: {
            layer_num: 1,
            tasks: [{ id: 'task-1', name: 'Task 1', dependencies: [] }],
          },
          layer2: {
            layer_num: 2,
            tasks: [
              { id: 'task-2', name: 'Task 2', dependencies: ['task-1'] },
              { id: 'task-3', name: 'Task 3', dependencies: ['task-1'] },
            ],
          },
          layer3: {
            layer_num: 3,
            tasks: [{ id: 'task-4', name: 'Task 4', dependencies: ['task-2', 'task-3'] }],
          },
        },
      };

      const result = generateDAGFromIndex(tasksIndex);

      expect(result).toContain('task_1 --> task_2');
      expect(result).toContain('task_1 --> task_3');
      expect(result).toContain('task_2 --> task_4');
      expect(result).toContain('task_3 --> task_4');
    });

    it('should replace special characters in task IDs', () => {
      const tasksIndex = {
        layers: {
          layer1: {
            layer_num: 1,
            tasks: [{ id: 'task.1-2', name: 'Task 1.2', dependencies: [] }],
          },
        },
      };

      const result = generateDAGFromIndex(tasksIndex);

      expect(result).toContain('task_1_2["Task 1.2"]');
    });

    it('should generate different colors for different layers', () => {
      const tasksIndex = {
        layers: {
          layer1: { layer_num: 1, tasks: [{ id: 'task-1', name: 'Task 1', dependencies: [] }] },
          layer2: { layer_num: 2, tasks: [{ id: 'task-2', name: 'Task 2', dependencies: [] }] },
          layer3: { layer_num: 3, tasks: [{ id: 'task-3', name: 'Task 3', dependencies: [] }] },
        },
      };

      const result = generateDAGFromIndex(tasksIndex);

      // Check that each layer has a unique HSL color
      expect(result).toContain('classDef layer1 fill:hsl(120,70%,80%)');
      expect(result).toContain('classDef layer2 fill:hsl(240,70%,80%)');
      expect(result).toContain('classDef layer3 fill:hsl(360,70%,80%)');
    });
  });
});
