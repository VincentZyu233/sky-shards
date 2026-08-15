import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCog, FaCalendarDay, FaEllipsisV, FaAngleRight } from 'react-icons/fa';
import { DateTime } from 'luxon';
import { DynamicCalendar } from '../../components/Calendar';
import { ClockNow } from '../../components/Clock';
import { useModal } from '../../context/ModalContext';
import { useNow } from '../../context/Now';
import { useSettings } from '../../context/Settings';
import { GameServer, getServerZone } from '../../data/server';
import { withBasePath } from '../../utils/basePath';
import DateSelectionModal from '../Modals/DateSelector';
import SettingsModal from '../Modals/Settings';

function HeaderDateTime({ navigateToday }: { navigateToday: () => void }) {
  const { application: now } = useNow();
  const { t } = useTranslation('application');
  const dateActive = Math.floor(now.second / 6) % 2 === 0;

  return (
    <div
      data-nosnippet
      onClick={navigateToday}
      className=' flex cursor-pointer flex-col flex-nowrap items-center justify-center gap-x-3 text-center md:flex-row landscape:flex-row'
    >
      <p className='max-md:hidden'>{t('headerDateTimeIndicator')}</p>
      <p
        className='short:swap data-[swap="true"]:short:swap-active max-md:swap data-[swap="true"]:max-md:swap-active tall:md:cursor-pointer tall:md:flex-col tall:md:gap-x-2'
        data-swap={dateActive}
      >
        <DynamicCalendar className='swap-on' />
        <span className='swap-off md:hidden'>{t('headerDateTimeIndicator')}</span>
      </p>
      <ClockNow dualUnit className='text-md xs:text-2xl' relFontSize={0} />
    </div>
  );
}

export function HeaderButton({
  children,
  title,
  isExpand = false,
  onClick,
}: {
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  isExpand?: boolean;
}) {
  return (
    <div
      className='tooltip tooltip-bottom hidden *:transition-all data-[expand=true]:block md:block md:data-[expand=true]:hidden max-md:group-data-[expand-menu=true]:block'
      data-tip={title}
      data-expand={isExpand}
    >
      <button
        type='button'
        title={title}
        className='w-min rounded-lg bg-slate-50 bg-opacity-25 p-1.5 shadow-xl shadow-zinc-700 hover:bg-opacity-50'
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  );
}

export default function Header() {
  const { t } = useTranslation(['application', 'dateSelector', 'settings']);
  const { server, setSettings } = useSettings();
  const { showModal } = useModal();
  const navigateToday = () => setSettings({ date: DateTime.local({ zone: getServerZone(server) }) });
  const [expandMenu, setExpandMenu] = useState(false);
  const servers: { value: GameServer; label: string }[] = [
    { value: 'tgc_global', label: '🌍 TGC Global 那游公司国际服' },
    { value: 'netease_cn', label: '🇨🇳 NetEase CN 网易国服' },
  ];

  return (
    <header
      className='group glass flex max-h-min flex-row flex-nowrap items-center justify-between gap-1 px-2 sm:px-4'
      data-expand-menu={expandMenu}
    >
      <div className='flex min-w-0 shrink-0 items-center gap-1.5 sm:gap-2 max-md:group-data-[expand-menu=true]:hidden'>
        <a href={`${withBasePath('/')}?server=${server}`} onClick={e => (navigateToday(), e.preventDefault())}>
          <img src={withBasePath('/icons/appName.webp')} alt='Sky Shards' className='h-7 w-auto md:h-10' />
        </a>
        <div
          role='group'
          aria-label='Game server / 游戏服务器'
          className='flex h-10 shrink-0 flex-col overflow-hidden rounded-md border border-white/30 bg-black/20 shadow-sm backdrop-blur-sm sm:h-7 sm:flex-row md:h-8'
        >
          {servers.map(option => {
            const active = server === option.value;
            return (
              <button
                key={option.value}
                type='button'
                aria-pressed={active}
                title={option.label}
                className='h-1/2 whitespace-nowrap px-1.5 text-[10px] font-semibold leading-none transition-colors aria-pressed:bg-primary aria-pressed:text-primary-content sm:h-full sm:px-2 sm:text-xs'
                onClick={() => setSettings({ server: option.value })}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <HeaderDateTime navigateToday={navigateToday} />

      <div className='flex shrink-0 flex-row gap-x-1 sm:gap-x-2'>
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
        <HeaderButton isExpand title='Expand' onClick={() => setExpandMenu(!expandMenu)}>
          {expandMenu ? <FaAngleRight size={18} /> : <FaEllipsisV size={18} />}
        </HeaderButton>
      </div>
    </header>
  );
}
