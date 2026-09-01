import { describe, expect, it } from 'vitest';

// Verifies the test harness itself: if this file fails, the configuration is
// broken, not the application.
describe('test harness', () => {
  it('runs with the test environment applied', () => {
    expect(process.env.NODE_ENV).toBe('test');
  });

  it('formats timestamps in UTC', () => {
    expect(new Date('2026-01-02T03:04:05Z').toISOString()).toBe('2026-01-02T03:04:05.000Z');
    expect(new Date('2026-01-02T03:04:05Z').getHours()).toBe(3);
  });
});
