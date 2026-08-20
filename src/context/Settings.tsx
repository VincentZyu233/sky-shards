/*
Handle routing, url manipulation, url parsing, history & state management.

URL Format before v7:
Path: /, /date/{yyyy}/{MM}/{dd}, date/{relDate}
Query: gsTrans=1, lang=xx.

new URL Format:
Path: /, /{relDate}, /{lang}/{relDate}, /{yyyy}/{MM}/{dd}, /{lang}/{yyyy}/{MM}/{dd},
Query: server=(tgc_global|netease_cn), fontSize, numCols=(5|7), legTimeline=(0|1), gsTrans=(0|1),
twelveHourMode=(true|false|system), lightMode=(true|false|system), timezone=(system|IANA zone).
*/
import { useState, useCallback, createContext, useContext, useMemo } from 'react';
import i18next from 'i18next';
import { DateTime, IANAZone, Settings as LuxonSettings } from 'luxon';
import { dateInServerZone, GameServer, getServerZone, isGameServer, parseGameServer } from '../data/server';
import useLegacyEffect from '../hooks/useLegacyEffect';
import { languageCode } from '../i18n';
import { stripBasePath, withBasePath } from '../utils/basePath';

const relDateMap = {
  eytd: -2,
  ereyesterday: -2,
  ytd: -1,
  yesterday: -1,
  tmr: 1,
  tomorrow: 1,
  ovmr: 2,
  overmorrow: 2,
} as const;

const displayModeValues = ['true', 'false', 'system'] as const;

function isDisplayMode(value: unknown): value is (typeof displayModeValues)[number] {
  return typeof value === 'string' && displayModeValues.includes(value as (typeof displayModeValues)[number]);
}

function isRelativeDate(value: string): value is keyof typeof relDateMap {
  return value in relDateMap;
}

function parseBooleanParam(value: string | null): boolean | undefined {
  if (value === '1') return true;
  if (value === '0') return false;
  return undefined;
}

function isOldUrlFormat(url: URL) {
  const { pathname, searchParams } = url;
  const [route] = pathname.split('/').filter(Boolean);
  return route === 'date' || searchParams.has('lang');
}

interface SettingsOld {
  date?: DateTime;
  gsTrans?: boolean;
  lang?: string;
  server?: GameServer;
}

function parseOldUrl(url: URL): SettingsOld {
  const ret: SettingsOld = {};

  const { pathname, searchParams } = url;
  const server = parseGameServer(searchParams.get('server'));
  const appZone = getServerZone(server);
  ret.server = server;
  ret.date = DateTime.now().setZone(appZone).startOf('day');
  if (searchParams.has('gsTrans')) ret.gsTrans = searchParams.get('gsTrans') === '1';
  if (searchParams.has('lang')) ret.lang = searchParams.get('lang')!;

  if (pathname !== '/') {
    const [route, ...params] = pathname.split('/').slice(1);
    if (route === 'date') {
      const [yearStr, monthStr, dayStr] = params;
      const year = parseInt(yearStr.length === 2 ? `20${yearStr}` : yearStr, 10);
      const month = monthStr ? parseInt(monthStr, 10) : 1;
      const day = dayStr ? parseInt(dayStr, 10) : 1;
      if (year && month && day) {
        const date = DateTime.local(year, month, day, { zone: appZone });
        if (date.isValid) {
          if (date < DateTime.local(2022, 10, 1, { zone: appZone })) {
            ret.date = DateTime.local(2022, 10, 1, { zone: appZone });
          } else {
            ret.date = date;
          }
        }
      }
    } else if (route in relDateMap) {
      const date = DateTime.local()
        .setZone(appZone)
        .plus({ days: relDateMap[route as keyof typeof relDateMap] });
      ret.date = date;
    }
  }

  return ret;
}

interface SettingsNew extends SettingsOld {
  twelveHourMode?: 'true' | 'false' | 'system';
  lightMode?: 'true' | 'false' | 'system';
  timezone?: string;
  fontSize?: string;
  numCols?: '5' | '7';
  /* Unix timestamp of Date that user last dismissed the warning */
  lastWarn?: number;
  /* Legacy Timeline Display */
  legTimeline?: boolean;
}

export const DEFAULT_FONT_SIZE = '1';

export function normalizeFontSize(value: unknown): string {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : Number.NaN;
  return Number.isFinite(parsed) && parsed > 0 ? String(parsed) : DEFAULT_FONT_SIZE;
}

export function normalizeLastWarn(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function validifySettings(settings: Partial<SettingsNew>) {
  // check if lang is in languageCode
  if ('lang' in settings && settings.lang && !(settings.lang in languageCode)) {
    delete settings.lang;
  }
  if ('server' in settings && !isGameServer(settings.server)) {
    delete settings.server;
  }
  if ('fontSize' in settings) {
    settings.fontSize = normalizeFontSize(settings.fontSize);
  }
  if ('twelveHourMode' in settings && !isDisplayMode(settings.twelveHourMode)) {
    delete settings.twelveHourMode;
  }
  if ('lightMode' in settings && !isDisplayMode(settings.lightMode)) {
    delete settings.lightMode;
  }
  if ('timezone' in settings && settings.timezone !== 'system' && !IANAZone.isValidZone(settings.timezone ?? '')) {
    delete settings.timezone;
  }
  if ('numCols' in settings && settings.numCols !== '5' && settings.numCols !== '7') {
    delete settings.numCols;
  }
  if ('legTimeline' in settings && typeof settings.legTimeline !== 'boolean') {
    delete settings.legTimeline;
  }
  if ('lastWarn' in settings) {
    const lastWarn = normalizeLastWarn(settings.lastWarn);
    if (lastWarn !== undefined) settings.lastWarn = lastWarn;
    else delete settings.lastWarn;
  }

  return settings;
}

function parseNewUrl(url: URL): SettingsNew {
  const ret: SettingsNew = {};

  let { pathname } = url;
  const { searchParams } = url;
  const server = parseGameServer(searchParams.get('server'));
  const appZone = getServerZone(server);
  ret.server = server;
  ret.date = DateTime.now().setZone(appZone).startOf('day');

  // Clean up the pathname
  if (pathname.endsWith('/')) {
    pathname = pathname.slice(0, -1);
  }
  if (pathname.startsWith('/')) {
    pathname = pathname.slice(1);
  }

  if (pathname) {
    const [yearLangOrRel, ...dateParts] = pathname.split('/');
    if (yearLangOrRel) {
      if (isRelativeDate(yearLangOrRel)) {
        ret.date = DateTime.now().setZone(appZone).startOf('day').plus({ days: relDateMap[yearLangOrRel] });
        dateParts.length = 0;
      } else if (!/^\d+$/.test(yearLangOrRel)) {
        ret.lang = yearLangOrRel;
        const relativeDate = dateParts[0];
        if (relativeDate && isRelativeDate(relativeDate)) {
          ret.date = DateTime.now().setZone(appZone).startOf('day').plus({ days: relDateMap[relativeDate] });
          dateParts.length = 0;
        }
      } else {
        dateParts.unshift(yearLangOrRel);
      }

      if (dateParts.length !== 0) {
        const [yearStr, monthStr, dayStr] = dateParts;
        const year = /^\d+$/.test(yearStr) ? parseInt(yearStr.length === 2 ? `20${yearStr}` : yearStr, 10) : 0;
        const month = !monthStr || /^\d+$/.test(monthStr) ? (monthStr ? parseInt(monthStr, 10) : 1) : 0;
        const day = !dayStr || /^\d+$/.test(dayStr) ? (dayStr ? parseInt(dayStr, 10) : 1) : 0;
        if (year && month && day) {
          const date = DateTime.local(year, month, day, { zone: appZone });
          if (date.isValid) ret.date = date;
        }
      }
    }
  }

  //Parse the query params
  const gsTrans = parseBooleanParam(searchParams.get('gsTrans'));
  if (gsTrans !== undefined) ret.gsTrans = gsTrans;
  const twelveHourMode = searchParams.get('twelveHourMode') ?? searchParams.get('twelveHour');
  if (isDisplayMode(twelveHourMode)) ret.twelveHourMode = twelveHourMode;
  const lightMode = searchParams.get('lightMode');
  if (isDisplayMode(lightMode)) ret.lightMode = lightMode;
  const timezone = searchParams.get('timezone');
  if (timezone === 'system' || (timezone && IANAZone.isValidZone(timezone))) ret.timezone = timezone;
  ret.fontSize = normalizeFontSize(searchParams.get('fontSize'));
  const numCols = searchParams.get('numCols');
  if (numCols === '5' || numCols === '7') ret.numCols = numCols;
  const legTimeline = parseBooleanParam(searchParams.get('legTimeline'));
  if (legTimeline !== undefined) ret.legTimeline = legTimeline;

  return ret;
}

export function parseSettingsUrl(url: URL): SettingsNew {
  return validifySettings(isOldUrlFormat(url) ? parseOldUrl(url) : parseNewUrl(url));
}

const sharedSettingKeys = ['twelveHourMode', 'lightMode', 'timezone', 'numCols', 'legTimeline'] as const;

export function serializeSettings(settings: SettingsNew, defaults: SettingsNew) {
  const urlParams = new URLSearchParams();
  const localSettings: Partial<SettingsNew> = {};

  if (settings.server) {
    urlParams.set('server', settings.server);
    localSettings.server = settings.server;
  }
  if (settings.fontSize !== undefined) {
    const fontSize = normalizeFontSize(settings.fontSize);
    urlParams.set('fontSize', fontSize);
    if (fontSize !== defaults.fontSize) localSettings.fontSize = fontSize;
  }
  if (settings.lang && settings.lang !== defaults.lang) localSettings.lang = settings.lang;
  if (settings.gsTrans !== undefined && settings.gsTrans !== defaults.gsTrans) {
    urlParams.set('gsTrans', settings.gsTrans ? '1' : '0');
  }
  if (settings.lastWarn !== undefined && settings.lastWarn !== defaults.lastWarn) {
    localSettings.lastWarn = settings.lastWarn;
  }

  for (const key of sharedSettingKeys) {
    const value = settings[key];
    if (value !== undefined && value !== defaults[key]) {
      urlParams.set(key, typeof value === 'boolean' ? (value ? '1' : '0') : value);
      Object.assign(localSettings, { [key]: value });
    }
  }

  return { urlParams, localSettings };
}

function getLocalStorageSettings(): SettingsNew {
  // Check if this is SSR
  try {
    if (!('localStorage' in globalThis)) return {};
    const ret: SettingsNew = {};
    const twelveHourMode = JSON.parse(localStorage.getItem('twelveHourMode') ?? 'null') as
      | 'true'
      | 'false'
      | 'system'
      | null;
    if (twelveHourMode) ret.twelveHourMode = twelveHourMode;
    const lightMode = JSON.parse(localStorage.getItem('lightMode') ?? 'null') as 'true' | 'false' | 'system' | null;
    if (lightMode) ret.lightMode = lightMode;
    const timezone = JSON.parse(localStorage.getItem('timezone') ?? 'null');
    if (timezone) ret.timezone = timezone;
    const language = JSON.parse(localStorage.getItem('language') ?? 'null');
    if (language) ret.lang = language;
    const fontSize = JSON.parse(localStorage.getItem('fontSize') ?? 'null');
    if (fontSize) ret.fontSize = fontSize;
    const numCols = JSON.parse(localStorage.getItem('dateSelector.numCols') ?? 'null') as '5' | '7' | null;
    if (numCols) ret.numCols = numCols;

    const settingsV2 = localStorage.getItem('settingsV2');
    if (settingsV2) {
      try {
        const parsed = JSON.parse(settingsV2);
        if (parsed) {
          Object.assign(ret, parsed);
        }
      } catch (err) {
        console.error('Failed to parse settingsV2', err);
      }
    }

    return ret;
  } catch (err) {
    // localStorage is disabled or blocked by the user('s browser)
    if (err instanceof DOMException && err.name === 'SecurityError') {
      return {};
    }
    throw err;
  }
}

function setLocalStorageSettings(settings: Partial<SettingsNew>) {
  try {
    // Check if this is SSR
    if (!('localStorage' in globalThis)) return;
    // Clear V1 settings
    localStorage.removeItem('twelveHourMode');
    localStorage.removeItem('lightMode');
    localStorage.removeItem('timezone');
    localStorage.removeItem('language');
    localStorage.removeItem('fontSize');
    localStorage.removeItem('dateSelector.numCols');

    if ('date' in settings) {
      settings = { ...settings };
      delete settings.date;
    }

    // Set new settings
    if ('gsTrans' in settings) delete settings.gsTrans;
    localStorage.setItem('settingsV2', JSON.stringify(settings));
  } catch (err) {
    // localStorage is disabled or blocked by the user('s browser)
    if (err instanceof DOMException && err.name === 'SecurityError') {
      return;
    }
    throw err;
  }
}

function getDefault(server: GameServer = 'tgc_global'): Required<SettingsNew> {
  let lang: string = 'en';

  if (navigator.language) {
    if (i18next.hasResourceBundle(navigator.language, 'shard')) {
      lang = navigator.language;
    }
    const shortLang = navigator.language.slice(0, 2);
    if (i18next.hasResourceBundle(shortLang, 'shard')) {
      lang = shortLang;
    }
  }

  try {
    for (const l of navigator.languages) {
      if (l.slice(0, 2) == 'en') {
        lang = 'en';
        break;
      }
      if (i18next.hasResourceBundle(l, 'shard')) {
        lang = l;
        break;
      }
    }
  } catch (err) {
    console.error('Failed to get navigator languages', err);
  }

  return {
    date: DateTime.now().setZone(getServerZone(server)).startOf('day'),
    gsTrans: false,
    lang,
    lightMode: 'system',
    twelveHourMode: 'system',
    timezone: 'system',
    fontSize: DEFAULT_FONT_SIZE,
    numCols: '5',
    lastWarn: 0,
    legTimeline: true,
    server,
  };
}

async function setLanguage(
  language: string,
  setLanguageLoader: (state: { loading: boolean; error?: string } | null) => void,
) {
  if (!language.endsWith('-GS')) {
    i18next.changeLanguage(language);
    document.documentElement.lang = LuxonSettings.defaultLocale = language;
  } else {
    // Load the language from google sheets
    setLanguageLoader({ loading: true });
    try {
      const promise = fetch(`${import.meta.env.VITE_GS_TRANSLATION_URL}?lang=${language.slice(0, -3)}`, {
        credentials: 'omit',
      }).then(res => res.json());

      const resource = await promise;
      if ('error' in resource) {
        throw new Error(resource.error);
      }

      for (const [ns, res] of Object.entries(resource)) {
        i18next.addResourceBundle(language, ns, res);
      }
      i18next.changeLanguage(language);
      document.documentElement.lang = LuxonSettings.defaultLocale = language.slice(0, -3);
      console.log('loaded language resources', language);
      setLanguageLoader({ loading: false });
    } catch (err) {
      console.error('failed to load language resources', language, err);
      setLanguageLoader({
        loading: false,
        error:
          err && typeof err === 'string'
            ? err
            : err && typeof err === 'object' && 'message' in err
              ? (err.message as string)
              : 'unknown error',
      });
      setTimeout(() => setLanguageLoader(null), 2000);
    }
  }
}

function setLightMode(lightMode: 'true' | 'false' | 'system') {
  if (lightMode === 'system') {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDarkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } else if (lightMode === 'true') {
    document.documentElement.setAttribute('data-theme', 'light');
  } else if (lightMode === 'false') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function setTimezone(timezone: string) {
  LuxonSettings.defaultZone = timezone;
}

type LanguageLoader = { loading: boolean; error?: string } | null;
type SetSettings = (edits?: Partial<SettingsNew>, setUrl?: boolean, pushHistory?: boolean) => void;

interface UseSettingsReturn extends Required<SettingsNew> {
  languageLoader: LanguageLoader;
  setSettings: SetSettings;
}

const SettingsContext = createContext<UseSettingsReturn>(null as unknown as UseSettingsReturn);

export function useSettings() {
  const settings = useContext(SettingsContext);
  if (!settings) throw new Error('useSettings must be used within a SettingsProvider');
  return settings;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [languageLoader, setLanguageLoader] = useState<LanguageLoader>(null);
  const [resolvedLocal, internalSetSettings] = useState<Required<SettingsNew>>(() => {
    const def = getDefault();
    const local = validifySettings(getLocalStorageSettings());
    return { ...def, ...local };
  });

  const settings = useMemo(() => {
    const url = new URL(window.location.href);
    url.pathname = stripBasePath(url.pathname);
    const parsed = parseSettingsUrl(url);
    return { ...resolvedLocal, ...parsed };
  }, [resolvedLocal]);

  useLegacyEffect(() => {}, [settings.lightMode, settings.timezone, settings.lang, settings.server]);

  const setSettings: SetSettings = useCallback(
    (edits, setUrl = true, pushHistory = true) => {
      // update url state and push to history
      const origin = window.location.origin;
      internalSetSettings(old => {
        const isInit = edits === undefined;
        let settings: Required<SettingsNew>;
        if (isInit) {
          const currentUrl = new URL(window.location.href);
          currentUrl.pathname = stripBasePath(currentUrl.pathname);
          const parsed = parseSettingsUrl(currentUrl);
          settings = { ...old, ...parsed };
        } else {
          const normalizedEdits = validifySettings({ ...edits });
          settings = { ...old, ...normalizedEdits };
        }

        if (edits?.server && edits.server !== old.server && !edits.date) {
          settings.date = dateInServerZone(old.date, edits.server);
        }

        const def = getDefault(settings.server);
        let path = '/' + settings.lang;
        if (!settings.date.hasSame(def.date, 'day')) {
          path += '/' + settings.date.toFormat('yyyy/MM/dd');
        }

        const url = new URL(withBasePath(path), origin);
        if (isInit || (edits && 'lightMode' in edits && edits.lightMode !== old.lightMode)) {
          // When lightMode is in edit
          setLightMode(settings.lightMode);
        }

        if (isInit || (edits && 'timezone' in edits && edits.timezone !== old.timezone)) {
          // When timezone is in edit
          setTimezone(settings.timezone);
        }

        if (isInit || (edits && 'lang' in edits && edits.lang !== old.lang)) {
          // When lang is in edit
          setLanguage(settings.lang, setLanguageLoader).catch(err => {
            console.error('Failed to set language', err);
            setLanguage(isInit ? 'en' : old.lang, setLanguageLoader);
          });
        }

        const { urlParams, localSettings } = serializeSettings(settings, def);

        if (setUrl) {
          url.search = urlParams.toString();
          const canonical = document.querySelector('link[rel="canonical"]');
          if (canonical) canonical.setAttribute('href', url.toString());
          else {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = url.toString();
            document.head.appendChild(link);
          }
          if (pushHistory && !isInit) history.pushState(null, '', url);
          else history.replaceState(null, '', url);
        }
        setLocalStorageSettings(localSettings);
        return settings;
      });
    },
    [internalSetSettings],
  );

  useLegacyEffect(() => {
    // Set the initial settings from the url
    setSettings();

    // Listen for popstate events to update the settings
    const handlePopState = () => {
      const url = new URL(window.location.href);
      url.pathname = stripBasePath(url.pathname);
      const urlSettings = parseSettingsUrl(url);
      const parsed = { ...getDefault(urlSettings.server), ...urlSettings };

      const diff = Object.fromEntries(
        Object.entries(parsed).filter(([key, val]) => settings[key as keyof SettingsNew] !== val),
      );

      if (Object.keys(diff).length > 0) {
        setSettings(diff, false, false);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const localT = i18next.getFixedT(resolvedLocal.lang, 'settings');
  const t = i18next.getFixedT(settings.lang, 'settings');

  return (
    <SettingsContext.Provider value={{ ...settings, languageLoader, setSettings }}>
      {settings.lang !== resolvedLocal.lang ? (
        <div className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transform text-center'>
          <div className='glass flex flex-col md:flex-row'>
            <div className='flex flex-col gap-2'>
              <h2 className='text-lg font-semibold'>{localT('language.title')}</h2>
              <button onClick={() => setSettings({ lang: resolvedLocal.lang })} className='btn btn-primary'>
                {localT('language.stay', { language: languageCode[resolvedLocal.lang] })}
              </button>
            </div>
            <div className='divider !m-0 md:divider-horizontal' />
            <div className='flex flex-col gap-2'>
              <h2 className='text-lg font-semibold'>{t('language.title')}</h2>
              <button onClick={() => setSettings({ lang: settings.lang })} className='btn btn-primary'>
                {t('language.switch', { language: languageCode[settings.lang] })}
              </button>
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </SettingsContext.Provider>
  );
}
