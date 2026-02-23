import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatDuration,
  formatFileSize,
} from '../format';

describe('format utils', () => {
  describe('formatDate', () => {
    it('should format Date object to ISO string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDate(date);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });

    it('should format date string to ISO string', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = formatDate(dateString);
      expect(result).toBe('2024-01-15T10:30:00.000Z');
    });
  });

  describe('formatDateTime', () => {
    it('should format Date object to locale string', () => {
      const date = new Date('2024-01-15T10:30:00Z');
      const result = formatDateTime(date);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });

    it('should format date string to locale string', () => {
      const dateString = '2024-01-15T10:30:00Z';
      const result = formatDateTime(dateString);
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should format time in seconds', () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const date = new Date('2024-01-15T10:29:45Z'); // 15 seconds ago
      const result = formatRelativeTime(date);
      expect(result).toBe('15 seconds ago');
    });

    it('should format time in minutes', () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const date = new Date('2024-01-15T10:25:00Z'); // 5 minutes ago
      const result = formatRelativeTime(date);
      expect(result).toBe('5 minutes ago');
    });

    it('should format time in hours', () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const date = new Date('2024-01-15T08:30:00Z'); // 2 hours ago
      const result = formatRelativeTime(date);
      expect(result).toBe('2 hours ago');
    });

    it('should format time in days', () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const date = new Date('2024-01-13T10:30:00Z'); // 2 days ago
      const result = formatRelativeTime(date);
      expect(result).toBe('2 days ago');
    });

    it('should handle singular forms correctly', () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const date1 = new Date('2024-01-15T10:29:59Z'); // 1 second ago
      expect(formatRelativeTime(date1)).toBe('1 second ago');

      const date2 = new Date('2024-01-15T10:29:00Z'); // 1 minute ago
      expect(formatRelativeTime(date2)).toBe('1 minute ago');

      const date3 = new Date('2024-01-15T09:30:00Z'); // 1 hour ago
      expect(formatRelativeTime(date3)).toBe('1 hour ago');

      const date4 = new Date('2024-01-14T10:30:00Z'); // 1 day ago
      expect(formatRelativeTime(date4)).toBe('1 day ago');
    });

    it('should accept date string', () => {
      const now = new Date('2024-01-15T10:30:00Z');
      vi.setSystemTime(now);

      const dateString = '2024-01-15T10:25:00Z'; // 5 minutes ago
      const result = formatRelativeTime(dateString);
      expect(result).toBe('5 minutes ago');
    });
  });

  describe('formatDuration', () => {
    it('should format duration in seconds', () => {
      expect(formatDuration(5000)).toBe('5s');
      expect(formatDuration(45000)).toBe('45s');
    });

    it('should format duration in minutes and seconds', () => {
      expect(formatDuration(60000)).toBe('1m 0s'); // 1 minute
      expect(formatDuration(125000)).toBe('2m 5s'); // 2 minutes 5 seconds
    });

    it('should format duration in hours, minutes, and seconds', () => {
      expect(formatDuration(3600000)).toBe('1h 0m 0s'); // 1 hour
      expect(formatDuration(3725000)).toBe('1h 2m 5s'); // 1 hour 2 minutes 5 seconds
      expect(formatDuration(7384000)).toBe('2h 3m 4s'); // 2 hours 3 minutes 4 seconds
    });

    it('should handle zero milliseconds', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('formatFileSize', () => {
    it('should format zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
    });

    it('should format bytes', () => {
      expect(formatFileSize(100)).toBe('100 B');
      expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(2048)).toBe('2 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB'); // 1024 * 1024
      expect(formatFileSize(2097152)).toBe('2 MB'); // 2 * 1024 * 1024
      expect(formatFileSize(1572864)).toBe('1.5 MB'); // 1.5 * 1024 * 1024
    });

    it('should format gigabytes', () => {
      expect(formatFileSize(1073741824)).toBe('1 GB'); // 1024 * 1024 * 1024
      expect(formatFileSize(2147483648)).toBe('2 GB');
      expect(formatFileSize(1610612736)).toBe('1.5 GB');
    });

    it('should format terabytes', () => {
      expect(formatFileSize(1099511627776)).toBe('1 TB'); // 1024 * 1024 * 1024 * 1024
      expect(formatFileSize(2199023255552)).toBe('2 TB');
    });

    it('should round to 2 decimal places', () => {
      expect(formatFileSize(1234567)).toBe('1.18 MB');
      expect(formatFileSize(987654321)).toBe('941.9 MB');
    });
  });
});
