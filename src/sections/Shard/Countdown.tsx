import { useTranslation, Trans } from 'react-i18next';
import { Settings, Zone } from 'luxon';
import Calendar from '../../components/Calendar';
import StaticClock, { Countdown } from '../../components/Clock';
import { useNow } from '../../context/Now';
import { ShardInfo } from '../../data/shard';

export function ShardCountdownSection({ info, className = '' }: { info: ShardInfo; className?: string }) {
  const { t } = useTranslation(['countdownSection', 'durationFmts']);
  const { application: now } = useNow();
  const { occurrences } = info;
  const upcommingIndex = occurrences.findIndex(({ end }) => end > now);
  const upcomming = upcommingIndex >= 0 ? occurrences[upcommingIndex] : undefined;
  const landed = upcomming && upcomming.land < now;
  const countdownTo = upcomming && landed ? occurrences[upcommingIndex]?.end : upcomming?.land;

  return (
    <section
      className={`glass grid min-w-[12rem] grid-cols-2 grid-rows-[auto_auto] place-items-center gap-x-3 gap-y-2 sm:gap-x-6 ${className}`}
    >
      {upcomming ? (
        <>
          <div className='col-span-2 col-start-1 row-start-1 w-full'>
            <Trans
              t={t}
              i18nKey={landed ? 'landed' : 'landing'}
              components={{
                bold: <span className='whitespace-nowrap font-bold' />,
                countdown: <Countdown to={countdownTo!} />,
                br: <br />,
              }}
              values={{
                i: upcommingIndex,
                landedSince: now.diff(upcomming.land, 'seconds').toFormat(t('durationFmts:hm')),
              }}
            />
          </div>
          <time
            className='col-start-1 row-start-2 w-full min-w-0 pr-3 text-left sm:pr-6'
            dateTime={countdownTo?.setZone('local')?.toISO({ suppressMilliseconds: true }) ?? undefined}
          >
            <strong>{t('yourTime')}</strong>
            <small className='hidden tall:block'>({(Settings.defaultZone as Zone).name})</small>
            <Calendar date={countdownTo!} convertTo='local' className='block font-bold opacity-80' relFontSize={0.8} />
            <StaticClock time={countdownTo} convertTo='local' className='block font-bold' />
          </time>
          <time
            className='col-start-2 row-start-2 w-full min-w-0 border-l border-white/25 pl-3 text-left sm:pl-6'
            dateTime={countdownTo?.toISO({ suppressMilliseconds: true }) ?? undefined}
          >
            <strong>{t('skyTime')}</strong>
            <small className='hidden tall:block'>({info.eventZone})</small>
            <Calendar date={countdownTo!} className='block font-bold opacity-80' relFontSize={0.8} />
            <StaticClock time={countdownTo} className='block font-bold' />
          </time>
        </>
      ) : (
        <div className='col-span-2 col-start-1 row-start-1 w-full'>
          <Trans
            t={t}
            tOptions={{ transWrapTextNodes: 'p' }}
            i18nKey='allEnded'
            components={{ bold: <span className='font-bold' />, countdown: <Countdown to={info.lastEnd!} /> }}
          />
        </div>
      )}
    </section>
  );
}
