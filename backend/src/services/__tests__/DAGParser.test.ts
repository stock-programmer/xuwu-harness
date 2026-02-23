import { DAGParser } from '../dag/DAGParser';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('DAGParser', () => {
  let dagParser: DAGParser;

  beforeEach(() => {
    dagParser = new DAGParser();
  });

  describe('parseTaskIndex', () => {
    it('should parse a valid task index file', async () => {
      // Use the actual task index file
      const taskIndexPath = path.join(
        process.cwd(),
        '..',
        'context',
        'dev-tasks',
        'backend',
        'tasks-index.json'
      );

      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);

      expect(taskIndex).toBeDefined();
      expect(taskIndex.total_tasks).toBeGreaterThan(0);
      expect(taskIndex.total_layers).toBeGreaterThan(0);
      expect(taskIndex.layers).toBeDefined();
      expect(typeof taskIndex.layers).toBe('object');
    });

    it('should throw error for non-existent file', async () => {
      await expect(
        dagParser.parseTaskIndex('/nonexistent/path.json')
      ).rejects.toThrow();
    });

    it('should validate required fields', async () => {
      const invalidData = {
        project_type: 'backend',
        // missing total_tasks, total_layers, layers
      };

      // Create a temporary file with invalid data
      const tempPath = path.join(process.cwd(), 'temp-invalid.json');
      await fs.writeFile(tempPath, JSON.stringify(invalidData));

      await expect(dagParser.parseTaskIndex(tempPath)).rejects.toThrow();

      // Cleanup
      await fs.unlink(tempPath);
    });
  });

  describe('buildDAG', () => {
    it('should build a valid DAG structure', async () => {
      const taskIndexPath = path.join(
        process.cwd(),
        '..',
        'context',
        'dev-tasks',
        'backend',
        'tasks-index.json'
      );

      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);
      const dag = dagParser.buildDAG(taskIndex);

      expect(dag).toBeDefined();
      expect(dag.layers).toBeDefined();
      expect(Array.isArray(dag.layers)).toBe(true);
      expect(dag.layers.length).toBeGreaterThan(0);
    });

    it('should correctly organize tasks by layers', async () => {
      const taskIndexPath = path.join(
        process.cwd(),
        '..',
        'context',
        'dev-tasks',
        'backend',
        'tasks-index.json'
      );

      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);
      const dag = dagParser.buildDAG(taskIndex);

      // Each layer should have tasks
      dag.layers.forEach((layer: any) => {
        expect(layer.tasks).toBeDefined();
        expect(Array.isArray(layer.tasks)).toBe(true);
      });
    });
  });

  describe('validateDAG', () => {
    it('should validate a correct DAG without circular dependencies', async () => {
      const taskIndexPath = path.join(
        process.cwd(),
        '..',
        'context',
        'dev-tasks',
        'backend',
        'tasks-index.json'
      );

      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);
      const dag = dagParser.buildDAG(taskIndex);

      const isValid = dagParser.validateDAG(dag);
      expect(isValid).toBe(true);
    });
  });

  describe('getTaskById', () => {
    it('should retrieve a task by its ID', async () => {
      const taskIndexPath = path.join(
        process.cwd(),
        '..',
        'context',
        'dev-tasks',
        'backend',
        'tasks-index.json'
      );

      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);
      const dag = dagParser.buildDAG(taskIndex);

      // Try to get first task
      const firstLayer = dag.layers[0];
      if (firstLayer && firstLayer.tasks.length > 0) {
        const taskId = firstLayer.tasks[0].id;
        const task = dagParser.getTaskById(dag, taskId);

        expect(task).toBeDefined();
        expect(task?.id).toBe(taskId);
      }
    });

    it('should return null for non-existent task ID', async () => {
      const taskIndexPath = path.join(
        process.cwd(),
        '..',
        'context',
        'dev-tasks',
        'backend',
        'tasks-index.json'
      );

      const taskIndex = await dagParser.parseTaskIndex(taskIndexPath);
      const dag = dagParser.buildDAG(taskIndex);

      const task = dagParser.getTaskById(dag, 'nonexistent-id');
      expect(task).toBeNull();
    });
  });
});
