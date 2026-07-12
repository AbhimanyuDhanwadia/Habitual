import { describe, expect, it } from 'vitest';
import { parseLocalDateKey, toLocalDateKey } from './date';

describe('date utilities', () => {
  it('formats dates using the local calendar day', () => {
    expect(toLocalDateKey(new Date(2026, 6, 13, 1, 30))).toBe('2026-07-13');
  });

  it('parses date keys at local noon to avoid timezone boundary drift', () => {
    const date = parseLocalDateKey('2026-07-13');

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(13);
    expect(date.getHours()).toBe(12);
  });
});
