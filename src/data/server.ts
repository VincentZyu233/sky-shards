import { DateTime } from 'luxon';

export type GameServer = 'tgc_global' | 'netease_cn';

interface GameServerConfig {
  zone: string;
  city: string;
  standardTimeLabel: string;
  daylightTimeLabel?: string;
}

export const gameServerConfig = {
  tgc_global: {
    zone: 'America/Los_Angeles',
    city: 'Los Angeles 洛杉矶',
    standardTimeLabel: '标准时间（冬令时）',
    daylightTimeLabel: '夏令时',
  },
  netease_cn: {
    zone: 'Asia/Shanghai',
    city: 'Shanghai 上海',
    standardTimeLabel: '中国标准时间',
  },
} as const satisfies Record<GameServer, GameServerConfig>;

export interface ServerTimeZonePresentation {
  city: string;
  zone: string;
  gmtOffset: string;
  seasonalLabel: string;
}

function formatGmtOffset(offsetMinutes: number): string {
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60);
  const minutes = absoluteMinutes % 60;
  return `GMT${sign}${hours}${minutes ? `:${minutes.toString().padStart(2, '0')}` : ''}`;
}

export function getServerTimeZonePresentation(server: GameServer, at: DateTime): ServerTimeZonePresentation {
  const config = gameServerConfig[server];
  const serverTime = at.setZone(config.zone);
  const daylightTimeLabel = 'daylightTimeLabel' in config ? config.daylightTimeLabel : undefined;

  return {
    city: config.city,
    zone: config.zone,
    gmtOffset: formatGmtOffset(serverTime.offset),
    seasonalLabel: daylightTimeLabel && serverTime.isInDST ? daylightTimeLabel : config.standardTimeLabel,
  };
}

export function isGameServer(value: unknown): value is GameServer {
  return value === 'tgc_global' || value === 'netease_cn';
}

export function parseGameServer(value: string | null | undefined): GameServer {
  return isGameServer(value) ? value : 'tgc_global';
}

export function getServerZone(server: GameServer): string {
  return gameServerConfig[server].zone;
}

export function dateInServerZone(date: DateTime, server: GameServer): DateTime {
  return DateTime.fromObject(
    { year: date.year, month: date.month, day: date.day },
    { zone: getServerZone(server), locale: date.locale ?? undefined },
  );
}
