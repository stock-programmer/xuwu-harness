import { ClaudeCodeExecutor } from '../ClaudeCodeExecutor';
import { ExecutionOptions } from '../../types/executor.types';

describe('ClaudeCodeExecutor', () => {
  describe('Constructor', () => {
    it('should create an instance', () => {
      const executor = new ClaudeCodeExecutor();
      expect(executor).toBeDefined();
      expect(executor).toBeInstanceOf(ClaudeCodeExecutor);
    });
  });

  describe('execute method exists', () => {
    it('should have execute method', () => {
      const executor = new ClaudeCodeExecutor();
      expect(executor.execute).toBeDefined();
      expect(typeof executor.execute).toBe('function');
    });
  });

  describe('isRunning', () => {
    it('should return false when not running', () => {
      const executor = new ClaudeCodeExecutor();
      expect(executor.isRunning()).toBe(false);
    });
  });

  describe('getStats', () => {
    it('should return execution stats', () => {
      const executor = new ClaudeCodeExecutor();
      const stats = executor.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalExecutions).toBeDefined();
      expect(stats.successfulExecutions).toBeDefined();
      expect(stats.failedExecutions).toBeDefined();
      expect(typeof stats.totalExecutions).toBe('number');
    });
  });
});
