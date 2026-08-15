import { DateTime } from 'luxon';
import { describe, expect, it } from 'vitest';
import { getServerZone } from './server';
import { getShardInfo } from './shard';

function cnDate(isoDate: string) {
  return DateTime.fromISO(isoDate, { zone: getServerZone('netease_cn') });
}

describe('NetEase CN shard schedule', () => {
  it('matches the known 2026-08-16 red shard example', () => {
    const info = getShardInfo(cnDate('2026-08-16'), { server: 'netease_cn' });

    expect(info).toMatchObject({
      server: 'netease_cn',
      eventZone: 'Asia/Shanghai',
      hasShard: true,
      isRed: true,
      realm: 'wasteland',
      map: 'wasteland.ark',
      rewardAC: 3.5,
      wasOverride: false,
    });
    expect(info.occurrences.map(({ land, end }) => [land.toFormat('HH:mm'), end.toFormat('HH:mm')])).toEqual([
      ['07:08', '08:00'],
      ['13:08', '14:00'],
      ['19:08', '20:00'],
    ]);
  });

  it.each(['2026-08-10', '2026-08-13', '2026-08-12', '2026-08-14', '2026-08-18', '2026-08-22'])(
    'marks %s as a no-shard day',
    isoDate => {
      expect(getShardInfo(cnDate(isoDate), { server: 'netease_cn' }).hasShard).toBe(false);
    },
  );

  it('uses the second-half Wednesday black shard schedule', () => {
    const info = getShardInfo(cnDate('2026-08-19'), { server: 'netease_cn' });

    expect(info).toMatchObject({ hasShard: true, isRed: false, realm: 'forest', map: 'forest.boneyard' });
    expect(info.occurrences.map(({ land }) => land.toFormat('HH:mm'))).toEqual(['09:08', '15:08', '19:08']);
  });

  it('ends the late Friday occurrence at midnight on the next date', () => {
    const info = getShardInfo(cnDate('2026-08-21'), { server: 'netease_cn' });
    const last = info.occurrences[2];

    expect(last.land.toISO()).toContain('2026-08-21T23:08:00.000+08:00');
    expect(last.end.toISO()).toContain('2026-08-22T00:00:00.000+08:00');
  });

  it('never applies an international override in CN mode', () => {
    const info = getShardInfo(cnDate('2026-08-16'), {
      server: 'netease_cn',
      override: { hasShard: false, isRed: false, map: 'prairie.butterfly' },
    });

    expect(info).toMatchObject({ hasShard: true, isRed: true, map: 'wasteland.ark', wasOverride: false });
  });
});

describe('global shard schedule regression', () => {
  it('keeps the existing international rule and override behavior', () => {
    const date = DateTime.fromISO('2026-08-16', { zone: getServerZone('tgc_global') });
    const calculated = getShardInfo(date, { server: 'tgc_global' });
    const overridden = getShardInfo(date, {
      server: 'tgc_global',
      override: { hasShard: true, isRed: true, map: 'wasteland.ark', realm: 3 },
    });

    expect(calculated).toMatchObject({ hasShard: false, isRed: false, map: 'prairie.butterfly' });
    expect(overridden).toMatchObject({ hasShard: true, isRed: true, map: 'wasteland.ark', wasOverride: true });
  });
});
