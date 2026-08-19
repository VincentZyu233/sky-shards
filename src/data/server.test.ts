import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { dateInServerZone, getServerTimeZonePresentation, getServerZone, parseGameServer } from './server';

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

  it('reports daylight and standard time for TGC Global', () => {
    const summer = getServerTimeZonePresentation('tgc_global', DateTime.fromISO('2026-07-01T12:00:00Z'));
    const winter = getServerTimeZonePresentation('tgc_global', DateTime.fromISO('2026-01-01T12:00:00Z'));

    expect(summer).toEqual({
      city: 'Los Angeles 洛杉矶',
      zone: 'America/Los_Angeles',
      gmtOffset: 'GMT-7',
      seasonalLabel: '夏令时',
    });
    expect(winter).toEqual({
      city: 'Los Angeles 洛杉矶',
      zone: 'America/Los_Angeles',
      gmtOffset: 'GMT-8',
      seasonalLabel: '标准时间（冬令时）',
    });
  });

  it('reports China Standard Time for NetEase CN', () => {
    const presentation = getServerTimeZonePresentation('netease_cn', DateTime.fromISO('2026-07-01T12:00:00Z'));

    expect(presentation).toEqual({
      city: 'Shanghai 上海',
      zone: 'Asia/Shanghai',
      gmtOffset: 'GMT+8',
      seasonalLabel: '中国标准时间',
    });
  });
});
