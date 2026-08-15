import { DateTime, Duration } from 'luxon';
import type { Translation } from '../i18n';
import type { Override } from './remoteConfig';
import { dateInServerZone, GameServer, getServerZone } from './server';

const landOffset = Duration.fromObject({ minutes: 8, seconds: 40 });
const endOffset = Duration.fromObject({ hours: 4 });
const blackShardInterval = Duration.fromObject({ hours: 8 });
const redShardInterval = Duration.fromObject({ hours: 6 });

const realms = ['prairie', 'forest', 'valley', 'wasteland', 'vault'] as const;
type Realm = (typeof realms)[number];
type Area = keyof Translation['skyMaps'];

interface GlobalShardConfig {
  noShardWkDay: number[];
  offset: Duration;
  interval: Duration;
  maps: [Area, Area, Area, Area, Area];
  defRewardAC?: number;
}

const globalShardsInfo = [
  {
    noShardWkDay: [6, 7],
    interval: blackShardInterval,
    offset: Duration.fromObject({ hours: 1, minutes: 50 }),
    maps: ['prairie.butterfly', 'forest.brook', 'valley.rink', 'wasteland.temple', 'vault.starlight'],
  },
  {
    noShardWkDay: [7, 1],
    interval: blackShardInterval,
    offset: Duration.fromObject({ hours: 2, minutes: 10 }),
    maps: ['prairie.village', 'forest.boneyard', 'valley.rink', 'wasteland.battlefield', 'vault.starlight'],
  },
  {
    noShardWkDay: [1, 2],
    interval: redShardInterval,
    offset: Duration.fromObject({ hours: 7, minutes: 40 }),
    maps: ['prairie.cave', 'forest.end', 'valley.dreams', 'wasteland.graveyard', 'vault.jelly'],
    defRewardAC: 2,
  },
  {
    noShardWkDay: [2, 3],
    interval: redShardInterval,
    offset: Duration.fromObject({ hours: 2, minutes: 20 }),
    maps: ['prairie.bird', 'forest.tree', 'valley.dreams', 'wasteland.crab', 'vault.jelly'],
    defRewardAC: 2.5,
  },
  {
    noShardWkDay: [3, 4],
    interval: redShardInterval,
    offset: Duration.fromObject({ hours: 3, minutes: 30 }),
    maps: ['prairie.island', 'forest.sunny', 'valley.hermit', 'wasteland.ark', 'vault.jelly'],
    defRewardAC: 3.5,
  },
] satisfies GlobalShardConfig[];

const overrideRewardAC: Partial<Record<Area, number>> = {
  'forest.end': 2.5,
  'valley.dreams': 2.5,
  'forest.tree': 3.5,
  'vault.jelly': 3.5,
};

export const numMapVarients: Partial<Record<Area, number>> = {
  'prairie.butterfly': 3,
  'prairie.village': 3,
  'prairie.bird': 2,
  'prairie.island': 3,
  'forest.brook': 2,
  'forest.end': 2,
  'valley.rink': 3,
  'valley.dreams': 2,
  'wasteland.temple': 3,
  'wasteland.battlefield': 3,
  'wasteland.graveyard': 2,
  'wasteland.crab': 2,
  'wasteland.ark': 4,
  'vault.starlight': 3,
  'vault.jelly': 2,
};

type TimeRange = readonly [landHour: number, landMinute: number, endHour: number, endMinute: number];

interface CnShardConfig {
  isRed: boolean;
  maps: readonly [Area, Area, Area, Area, Area];
  rewards?: readonly [number, number, number, number, number];
  times: readonly [TimeRange, TimeRange, TimeRange];
}

// Adapted from https://github.com/ichozero/skyshard_calendar.
const cnShardsInfo: Partial<Record<number, CnShardConfig>> = {
  2: {
    isRed: false,
    maps: ['prairie.butterfly', 'forest.brook', 'valley.rink', 'wasteland.temple', 'vault.starlight'],
    times: [
      [9, 8, 10, 0],
      [14, 8, 15, 0],
      [19, 8, 20, 0],
    ],
  },
  3: {
    isRed: false,
    maps: ['prairie.village', 'forest.boneyard', 'valley.rink', 'wasteland.battlefield', 'vault.starlight'],
    times: [
      [9, 8, 10, 0],
      [15, 8, 16, 0],
      [19, 8, 20, 0],
    ],
  },
  5: {
    isRed: true,
    maps: ['prairie.bird', 'forest.tree', 'valley.dreams', 'wasteland.crab', 'vault.jelly'],
    rewards: [2.5, 3.5, 2.5, 2.5, 3.5],
    times: [
      [11, 8, 12, 0],
      [17, 8, 18, 0],
      [23, 8, 24, 0],
    ],
  },
  6: {
    isRed: true,
    maps: ['prairie.cave', 'forest.end', 'valley.dreams', 'wasteland.graveyard', 'vault.jelly'],
    rewards: [2, 2.5, 2.5, 2, 3.5],
    times: [
      [10, 8, 11, 0],
      [14, 8, 15, 0],
      [22, 8, 23, 0],
    ],
  },
  7: {
    isRed: true,
    maps: ['prairie.island', 'forest.sunny', 'valley.hermit', 'wasteland.ark', 'vault.jelly'],
    rewards: [3.5, 3.5, 3.5, 3.5, 3.5],
    times: [
      [7, 8, 8, 0],
      [13, 8, 14, 0],
      [19, 8, 20, 0],
    ],
  },
};

export interface ShardOccurrence {
  land: DateTime;
  end: DateTime;
}

export interface ShardInfo {
  date: DateTime;
  eventZone: string;
  server: GameServer;
  isRed: boolean;
  hasShard: boolean;
  lastEnd: DateTime;
  realm: Realm;
  map: Area;
  numVarient: number;
  rewardAC?: number;
  occurrences: ShardOccurrence[];
  wasOverride: boolean;
}

export interface GetShardInfoOptions {
  server?: GameServer;
  override?: Override;
}

function getGlobalShardInfo(date: DateTime, override?: Override): ShardInfo {
  const server = 'tgc_global';
  const today = dateInServerZone(date, server);
  const [dayOfMth, dayOfWk] = [today.day, today.weekday];
  const isRed = override?.isRed ?? dayOfMth % 2 === 1;
  const realmIdx = override?.realm ?? (dayOfMth - 1) % 5;
  const infoIndex = override?.group ?? (dayOfMth % 2 === 1 ? (((dayOfMth - 1) / 2) % 3) + 2 : (dayOfMth / 2) % 2);
  const { noShardWkDay, interval, offset, maps, defRewardAC } = globalShardsInfo[infoIndex];
  const hasShard = override?.hasShard ?? !noShardWkDay.includes(dayOfWk);
  const map = override?.map ?? maps[realmIdx];
  const rewardAC = isRed ? overrideRewardAC[map] ?? defRewardAC : undefined;
  let firstStart = today.plus(offset);

  if (dayOfWk === 7 && today.isInDST !== firstStart.isInDST) {
    firstStart = firstStart.plus({ hours: firstStart.isInDST ? -1 : 1 });
  }

  const occurrences = Array.from({ length: 3 }, (_, i) => {
    const start = firstStart.plus(interval.mapUnits(value => value * i));
    return { land: start.plus(landOffset), end: start.plus(endOffset) };
  });

  return {
    date: today,
    eventZone: getServerZone(server),
    server,
    isRed,
    hasShard,
    lastEnd: occurrences[2].end,
    realm: realms[realmIdx],
    map,
    numVarient: numMapVarients[map] ?? 1,
    rewardAC,
    occurrences,
    wasOverride: !!override,
  };
}

function getCnShardInfo(date: DateTime): ShardInfo {
  const server = 'netease_cn';
  const today = dateInServerZone(date, server);
  const [dayOfMth, dayOfWk] = [today.day, today.weekday];
  const noShardByWeekday = dayOfWk === 1 || dayOfWk === 4;
  const noShardByHalfMonth = dayOfMth <= 15 ? dayOfWk === 3 || dayOfWk === 5 : dayOfWk === 2 || dayOfWk === 6;
  const hasShard = !noShardByWeekday && !noShardByHalfMonth;
  const config = cnShardsInfo[dayOfWk] ?? cnShardsInfo[2]!;
  const realmIdx = (dayOfMth + 2) % 5;
  const map = config.maps[realmIdx];
  const occurrences = config.times.map(([landHour, landMinute, endHour, endMinute]) => ({
    land: today.plus({ hours: landHour, minutes: landMinute }),
    end: endHour === 24 ? today.plus({ days: 1 }) : today.plus({ hours: endHour, minutes: endMinute }),
  }));

  return {
    date: today,
    eventZone: getServerZone(server),
    server,
    isRed: config.isRed,
    hasShard,
    lastEnd: occurrences[2].end,
    realm: realms[realmIdx],
    map,
    numVarient: numMapVarients[map] ?? 1,
    rewardAC: config.rewards?.[realmIdx],
    occurrences,
    wasOverride: false,
  };
}

export function getShardInfo(date: DateTime, options: GetShardInfoOptions = {}): ShardInfo {
  const server = options.server ?? 'tgc_global';
  return server === 'netease_cn' ? getCnShardInfo(date) : getGlobalShardInfo(date, options.override);
}

interface FindShardOptions {
  only?: 'black' | 'red';
  server?: GameServer;
}

export function findNextShard(from: DateTime, options: FindShardOptions = {}): ShardInfo {
  const { only, server = 'tgc_global' } = options;
  const info = getShardInfo(from, { server });
  if (info.hasShard && from < info.lastEnd && (!only || (only === 'red') === info.isRed)) return info;
  return findNextShard(from.plus({ days: 1 }), { only, server });
}
