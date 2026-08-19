import { useTranslation } from 'react-i18next';
import { FaCalendarDay, FaCog } from 'react-icons/fa';
import { DateTime } from 'luxon';
import { DynamicCalendar } from '../../components/Calendar';
import { ClockNow } from '../../components/Clock';
import { useModal } from '../../context/ModalContext';
import { useNow } from '../../context/Now';
import { useSettings } from '../../context/Settings';
import { GameServer, getServerTimeZonePresentation, getServerZone } from '../../data/server';
import { withBasePath } from '../../utils/basePath';
import DateSelectionModal from '../Modals/DateSelector';
import SettingsModal from '../Modals/Settings';

function HeaderDateTime({ navigateToday, server }: { navigateToday: () => void; server: GameServer }) {
  const { application: now } = useNow();
  const { t } = useTranslation('application');
  const timeZone = getServerTimeZonePresentation(server, now);

  return (
    <button
      type='button'
      data-nosnippet
      onClick={navigateToday}
      className='flex min-w-0 max-w-full flex-col items-center justify-center rounded-md px-1 text-center'
      title={t('headerDateTimeIndicator')}
    >
      <span className='flex min-w-0 flex-col items-center justify-center sm:flex-row sm:gap-x-3'>
        <span className='max-md:hidden'>{t('headerDateTimeIndicator')}</span>
        <DynamicCalendar className='whitespace-nowrap text-xs xs:text-sm md:text-base' />
        <ClockNow dualUnit className='whitespace-nowrap text-sm xs:text-lg md:text-xl' relFontSize={0} />
      </span>
      <small className='flex max-w-full flex-wrap items-center justify-center gap-x-1 text-[9px] leading-tight opacity-75 xs:text-[10px] md:text-xs'>
        <span>{timeZone.city}</span>
        <span aria-hidden='true'>·</span>
        <span>{timeZone.gmtOffset}</span>
        <span aria-hidden='true'>·</span>
        <span>{timeZone.seasonalLabel}</span>
        <span aria-hidden='true'>·</span>
        <span className='font-mono'>{timeZone.zone}</span>
      </small>
    </button>
  );
}

export function HeaderButton({
  children,
  title,
  onClick,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) {
  return (
    <div className='tooltip tooltip-bottom' data-tip={title}>
      <button type='button' title={title} className='icon-button' onClick={onClick}>
        {children}
      </button>
    </div>
  );
}

export default function Header() {
  const { t } = useTranslation(['application', 'dateSelector', 'settings']);
  const { fontSize, server, setSettings } = useSettings();
  const { showModal } = useModal();
  const navigateToday = () => setSettings({ date: DateTime.local({ zone: getServerZone(server) }) });
  const servers: { value: GameServer; label: string }[] = [
    { value: 'tgc_global', label: '🌍 TGC Global 那游公司国际服' },
    { value: 'netease_cn', label: '🇨🇳 NetEase CN 网易国服' },
  ];

  return (
    <header className='glass grid shrink-0 grid-cols-[auto_1fr_auto] grid-rows-[auto_auto] items-center gap-x-2 gap-y-1 px-2 py-1 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:grid-rows-1 sm:px-3'>
      <div className='col-start-1 row-start-1 flex min-w-0 items-center sm:justify-self-start'>
        <a
          href={`${withBasePath('/')}?fontSize=${encodeURIComponent(fontSize)}&server=${server}`}
          onClick={e => (navigateToday(), e.preventDefault())}
        >
          <img src={withBasePath('/icons/appName.webp')} alt='Sky Shards' className='h-8 w-auto md:h-10' />
        </a>
      </div>

      <div className='col-start-2 row-start-1 min-w-0 justify-self-center sm:col-start-3'>
        <HeaderDateTime navigateToday={navigateToday} server={server} />
      </div>

      <div className='col-start-3 row-start-1 flex shrink-0 gap-1 justify-self-end sm:col-start-4'>
        <HeaderButton
          title={t('dateSelector:title')}
          onClick={() => {
            showModal({
              children: DateSelectionModal,
              hideOnOverlayClick: true,
              title: t('dateSelector:title'),
            });
          }}
        >
          <FaCalendarDay size={18} />
        </HeaderButton>
        <HeaderButton
          title={t('settings:title')}
          onClick={() => {
            showModal({
              children: SettingsModal,
              hideOnOverlayClick: true,
              title: t('settings:title'),
            });
          }}
        >
          <FaCog size={18} />
        </HeaderButton>
      </div>
      <div
        role='group'
        aria-label='Game server / 游戏服务器'
        className='join col-span-3 row-start-2 grid w-full grid-cols-2 overflow-hidden rounded-md border border-white/30 bg-black/20 shadow-sm sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:w-auto sm:max-w-full'
      >
        {servers.map(option => {
          const active = server === option.value;
          return (
            <button
              key={option.value}
              type='button'
              aria-pressed={active}
              title={option.label}
              className='join-item min-h-9 min-w-0 whitespace-normal px-2 text-[11px] font-semibold leading-tight transition-colors aria-pressed:bg-primary aria-pressed:text-primary-content sm:min-h-10 sm:text-xs'
              onClick={() => setSettings({ server: option.value })}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </header>
  );
}
