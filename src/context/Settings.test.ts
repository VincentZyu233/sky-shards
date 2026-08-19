import { describe, expect, it } from 'vitest';
import { DEFAULT_FONT_SIZE, normalizeFontSize } from './Settings';

describe('font size settings', () => {
  it('defaults missing and invalid values to one', () => {
    expect(DEFAULT_FONT_SIZE).toBe('1');
    expect(normalizeFontSize(null)).toBe('1');
    expect(normalizeFontSize('')).toBe('1');
    expect(normalizeFontSize('invalid')).toBe('1');
    expect(normalizeFontSize('0')).toBe('1');
    expect(normalizeFontSize('-1')).toBe('1');
    expect(normalizeFontSize('Infinity')).toBe('1');
  });

  it('preserves valid positive numeric values', () => {
    expect(normalizeFontSize('1.2')).toBe('1.2');
    expect(normalizeFontSize(0.8)).toBe('0.8');
  });
});
