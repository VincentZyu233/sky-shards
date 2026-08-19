import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BsChevronCompactDown, BsChevronLeft, BsChevronRight } from 'react-icons/bs';
import { AnimatePresence, motion } from 'framer-motion';
import { DateTime } from 'luxon';
import { Settings as LuxonSettings } from 'luxon';
import { useModal } from '../../context/ModalContext';
import { useSettings } from '../../context/Settings';
import { useRemoteConfig } from '../../data/remoteConfig';
import { getShardInfo } from '../../data/shard';
import useLegacyEffect from '../../hooks/useLegacyEffect';
import { withBasePath } from '../../utils/basePath';
import WarningModal from '../Modals/Warning';
import { ShardCountdownSection } from './Countdown';
import ShardInfoSection from './Info';
import { ShardMapInfographic, ShardDataInfographic, ShardMemoryInfographic } from './Infographic';
import ShardProgressSection from './Progress';

const varients = {
  enter: (direction: number) => ({ x: direction < 0 ? '-100%' : '100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
};

export default function ShardCarousel() {
  const { t, i18n } = useTranslation('shardCarousel');
  const [applyOverride, setApplyOverride] = useState(true);

  const { date, lang, fontSize, lastWarn, legTimeline, server, setSettings } = useSettings();
  const prevDate = useRef(date);
  const direction = useMemo(() => (prevDate.current < date ? 1 : -1), [date]);
  useEffect(() => ((prevDate.current = date), undefined), [date]);

  const { showModal } = useModal();
  const daysDiff = date.diffNow('days').days;
  const remoteConfig = useRemoteConfig(daysDiff < -2 || daysDiff > 0, server === 'tgc_global');

  const remoteDailyConfig = useMemo(
    () => (server === 'tgc_global' ? remoteConfig?.dailiesMap[date.toISODate() as string] : undefined),
    [remoteConfig, date, server],
  );

  const { info, tmr, ytd } = useMemo(
    () => ({
      info: getShardInfo(date, {
        server,
        override: server === 'tgc_global' ? (applyOverride && remoteDailyConfig?.override) || undefined : undefined,
      }),
      tmr: date.plus({ days: 1 }),
      ytd: date.minus({ days: 1 }),
    }),
    [date.day, date.month, date.year, server, applyOverride, remoteDailyConfig],
  );
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const { hasShard, isRed, map } = info;
    const dateString = date.setLocale(LuxonSettings.defaultLocale).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
    document.title =
      (hasShard
        ? t('dynamicTitle.hasShard', { color: isRed ? 'red' : 'black', map, date: dateString })
        : t('dynamicTitle.noShard', { date: dateString })) + ' - Sky Shards';
  }, [date.day, date.month, date.year, info.hasShard, info.isRed, i18n.language]);

  useLegacyEffect(() => {
    if (remoteConfig && remoteConfig.warning) {
      const last = DateTime.fromSeconds(lastWarn).setZone(info.eventZone);
      const shouldWarn = !DateTime.now().setZone(info.eventZone).hasSame(last, 'day');
      if (shouldWarn) {
        showModal({
          children: WarningModal,
          hideCloseButton: true,
        });
      }
    }
  }, [remoteConfig?.warning, lastWarn]);

  return (
    <div
      className='grid h-full min-h-0 w-full select-none grid-cols-[2.75rem_minmax(0,1fr)_2.75rem] items-center justify-items-center gap-2 overflow-hidden px-1 py-2 text-center sm:px-2'
      ref={carouselRef}
    >
      <AnimatePresence initial={false} custom={direction}>
        <motion.main
          key={date.toISODate()}
          className='no-scrollbar col-start-2 row-start-1 flex h-full min-h-0 w-full max-w-7xl flex-col items-center gap-4 overflow-y-auto overflow-x-hidden px-1 pb-4 text-center sm:px-3'
          initial='enter'
          animate='center'
          exit='exit'
          variants={varients}
          transition={{ type: 'spring', duration: 0.3 }}
          custom={direction}
          drag='x'
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.8}
          dragMomentum={false}
          onDragEnd={(_, { offset, velocity }) => {
            const swipe = offset.x > 0 ? -1 : 1;
            const swipePower = offset.x * velocity.x;
            if (swipePower > 4000) {
              setSettings({ date: date.plus({ days: Math.sign(swipe) }) });
            }
          }}
          style={{ fontSize: `${fontSize}em` }}
        >
          <div className='grid min-h-full w-full content-center items-stretch gap-3 py-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)] lg:grid-rows-[auto_auto_auto]'>
            <ShardInfoSection
              info={info}
              remoteDailyConfig={remoteDailyConfig}
              remoteAuthorNames={remoteConfig?.authorNames}
              toggleOverride={() => setApplyOverride(!applyOverride)}
              className='w-full px-4 py-3 shadow-md shadow-black/15 lg:col-start-1 lg:row-start-1'
            />

            {info.hasShard && (
              <>
                {legTimeline && (
                  <ShardProgressSection
                    info={info}
                    className='max-w-none px-4 py-2 shadow-md shadow-black/15 lg:col-start-1 lg:row-start-2'
                  />
                )}
                <ShardCountdownSection
                  info={info}
                  className='w-full min-w-0 px-5 py-5 shadow-lg shadow-black/20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:h-full lg:content-center'
                />
                <small
                  className='flex cursor-pointer flex-col items-center justify-center text-xs opacity-75 lg:col-span-2 lg:row-start-3 [@media_(min-height:_640px)]:xl:text-base'
                  onClick={() => {
                    const carousel = carouselRef.current;
                    const content = carousel?.children[0];
                    const summary = content?.children[0];
                    content?.scrollTo({ top: summary?.clientHeight, behavior: 'smooth' });
                  }}
                >
                  <span>{t('navigation.downwards')}</span>
                  <BsChevronCompactDown />
                </small>
              </>
            )}
          </div>
          {info.hasShard && (
            <div className='grid w-full grid-cols-1 items-start justify-items-center gap-4 rounded-lg border border-white/15 bg-black/10 p-3 md:grid-cols-2 xl:grid-cols-3'>
              <ShardMemoryInfographic remoteDailyConfig={remoteDailyConfig} authorNames={remoteConfig?.authorNames} />
              <ShardMapInfographic
                info={info}
                remoteDailyConfig={remoteDailyConfig}
                authorNames={remoteConfig?.authorNames}
              />
              <ShardDataInfographic info={info} />
            </div>
          )}
        </motion.main>
      </AnimatePresence>
      <a
        href={`${withBasePath(`/${lang}/${ytd.toFormat('yyyy/MM/dd')}`)}?server=${server}`}
        className='group relative col-start-1 row-start-1 flex h-full cursor-pointer flex-col-reverse items-center justify-center gap-2 text-xs'
        onClick={e => {
          e.preventDefault();
          setSettings({ date: ytd });
        }}
      >
        <span className='hidden leading-none opacity-70 [writing-mode:vertical-rl] md:block'>
          {t('navigation.rightwards')}
        </span>
        <BsChevronRight
          className='m-0 h-11 w-11 shrink-0 rounded-md border border-white/20 bg-black/25 p-3 group-hover:bg-black/40'
          strokeWidth={'0.1rem'}
        />
      </a>
      <a
        href={`${withBasePath(`/${lang}/${tmr.toFormat('yyyy/MM/dd')}`)}?server=${server}`}
        className='group relative col-start-3 row-start-1 flex h-full cursor-pointer flex-col items-center justify-center gap-2 text-xs'
        onClick={e => {
          e.preventDefault();
          setSettings({ date: tmr });
        }}
      >
        <span className='hidden leading-none opacity-70 [writing-mode:vertical-rl] md:block'>
          {t('navigation.leftwards')}
        </span>
        <BsChevronLeft
          className='m-0 h-11 w-11 shrink-0 rounded-md border border-white/20 bg-black/25 p-3 group-hover:bg-black/40'
          strokeWidth={'0.1rem'}
        />
      </a>
    </div>
  );
}
