import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { dateInServerZone, getServerZone, parseGameServer } from './server';

describe('game server settings', () => {
  it('defaults missing and invalid URL values to TGC Global', () => {
    expect(parseGameServer(null)).toBe('tgc_global');
    expect(parseGameServer('invalid')).toBe('tgc_global');
  });

  it('uses the configured event zones', () => {
    expect(getServerZone('tgc_global')).toBe('America/Los_Angeles');
    expect(getServerZone('netease_cn')).toBe('Asia/Shanghai');
  });

  it('preserves the calendar date when switching servers', () => {
    const globalDate = DateTime.fromISO('2026-08-16T00:00:00', { zone: getServerZone('tgc_global') });
    const cnDate = dateInServerZone(globalDate, 'netease_cn');

    expect(cnDate.toISODate()).toBe('2026-08-16');
    expect(cnDate.zoneName).toBe('Asia/Shanghai');
  });
});
