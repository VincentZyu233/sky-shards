import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_FONT_SIZE,
  normalizeFontSize,
  normalizeLastWarn,
  parseSettingsUrl,
  serializeSettings,
} from './Settings';

afterEach(() => {
  vi.useRealTimers();
});

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

describe('warning dismissal settings', () => {
  it('migrates legacy timestamp strings and rejects invalid values', () => {
    expect(normalizeLastWarn('1787155200')).toBe(1787155200);
    expect(normalizeLastWarn(1787155200)).toBe(1787155200);
    expect(normalizeLastWarn('invalid')).toBeUndefined();
    expect(normalizeLastWarn(-1)).toBeUndefined();
  });
});

describe('URL settings', () => {
  it.each([
    ['/tomorrow', '2026-08-21'],
    ['/tmr', '2026-08-21'],
    ['/zh/tomorrow', '2026-08-21'],
    ['/zh/tmr', '2026-08-21'],
    ['/yesterday', '2026-08-19'],
    ['/ytd', '2026-08-19'],
    ['/en/yesterday', '2026-08-19'],
    ['/en/ytd', '2026-08-19'],
  ])('parses relative route %s', (pathname, expectedDate) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00Z'));

    const settings = parseSettingsUrl(new URL(pathname, 'https://example.com'));

    expect(settings.date?.toISODate()).toBe(expectedDate);
  });

  it('calculates relative dates in the selected server timezone', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-21T01:00:00Z'));

    const global = parseSettingsUrl(new URL('/zh/tomorrow?server=tgc_global', 'https://example.com'));
    const netease = parseSettingsUrl(new URL('/zh/tomorrow?server=netease_cn', 'https://example.com'));

    expect(global.date?.toISODate()).toBe('2026-08-21');
    expect(netease.date?.toISODate()).toBe('2026-08-22');
  });

  it('parses explicit and legacy date routes', () => {
    const current = parseSettingsUrl(new URL('/zh/2026/08/20', 'https://example.com'));
    const legacy = parseSettingsUrl(new URL('/date/2023/1/1?lang=zh', 'https://example.com'));

    expect(current.lang).toBe('zh');
    expect(current.date?.toISODate()).toBe('2026-08-20');
    expect(legacy.lang).toBe('zh');
    expect(legacy.date?.toISODate()).toBe('2023-01-01');
  });

  it('falls back to today for an invalid date and ignores an unsupported language', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-20T12:00:00Z'));

    const invalidDate = parseSettingsUrl(new URL('/zh/not-a-date', 'https://example.com'));
    const invalidLanguage = parseSettingsUrl(new URL('/unsupported/2026/08/20', 'https://example.com'));

    expect(invalidDate.lang).toBe('zh');
    expect(invalidDate.date?.toISODate()).toBe('2026-08-20');
    expect(invalidLanguage.lang).toBeUndefined();
    expect(invalidLanguage.date?.toISODate()).toBe('2026-08-20');
  });

  it('parses supported query parameter values', () => {
    const settings = parseSettingsUrl(
      new URL(
        '/zh?gsTrans=0&twelveHourMode=true&lightMode=false&timezone=Asia%2FShanghai&numCols=7&legTimeline=0',
        'https://example.com',
      ),
    );

    expect(settings).toMatchObject({
      gsTrans: false,
      twelveHourMode: 'true',
      lightMode: 'false',
      timezone: 'Asia/Shanghai',
      numCols: '7',
      legTimeline: false,
    });
  });

  it('ignores unsupported query parameter values', () => {
    const settings = parseSettingsUrl(
      new URL(
        '/zh?twelveHourMode=invalid&lightMode=invalid&timezone=Not%2FAZone&numCols=9&legTimeline=yes',
        'https://example.com',
      ),
    );

    expect(settings.twelveHourMode).toBeUndefined();
    expect(settings.lightMode).toBeUndefined();
    expect(settings.timezone).toBeUndefined();
    expect(settings.numCols).toBeUndefined();
    expect(settings.legTimeline).toBeUndefined();
  });

  it('supports the legacy twelveHour parameter and prioritizes twelveHourMode', () => {
    const legacy = parseSettingsUrl(new URL('/zh?twelveHour=true', 'https://example.com'));
    const both = parseSettingsUrl(new URL('/zh?twelveHour=false&twelveHourMode=system', 'https://example.com'));

    expect(legacy.twelveHourMode).toBe('true');
    expect(both.twelveHourMode).toBe('system');
  });
});

describe('URL and local setting serialization', () => {
  it('uses the canonical twelveHourMode parameter', () => {
    const { urlParams, localSettings } = serializeSettings({ twelveHourMode: 'true' }, { twelveHourMode: 'system' });

    expect(urlParams.get('twelveHourMode')).toBe('true');
    expect(urlParams.has('twelveHour')).toBe(false);
    expect(localSettings.twelveHourMode).toBe('true');
  });

  it('keeps lastWarn local and gsTrans in the URL', () => {
    const { urlParams, localSettings } = serializeSettings(
      { gsTrans: true, lastWarn: 1787155200 },
      { gsTrans: false, lastWarn: 0 },
    );

    expect(urlParams.get('gsTrans')).toBe('1');
    expect(urlParams.has('lastWarn')).toBe(false);
    expect(localSettings.gsTrans).toBeUndefined();
    expect(localSettings.lastWarn).toBe(1787155200);
  });

  it('preserves boolean settings as booleans in local storage data', () => {
    const { urlParams, localSettings } = serializeSettings({ legTimeline: false }, { legTimeline: true });

    expect(urlParams.get('legTimeline')).toBe('0');
    expect(localSettings.legTimeline).toBe(false);
  });
});
