import { DateTime } from 'luxon';

export type GameServer = 'tgc_global' | 'netease_cn';

export const gameServerConfig = {
  tgc_global: { zone: 'America/Los_Angeles' },
  netease_cn: { zone: 'Asia/Shanghai' },
} as const satisfies Record<GameServer, { zone: string }>;

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
