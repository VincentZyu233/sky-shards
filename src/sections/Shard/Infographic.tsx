import { ReactNode, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BiLinkExternal } from 'react-icons/bi';
import { BsDiscord } from 'react-icons/bs';
import { DailyConfig } from '../../data/remoteConfig';
import { ShardInfo } from '../../data/shard';
import { withBasePath } from '../../utils/basePath';

interface ShardInfographicsProps {
  title: string;
  image: string;
  imageAlt: string;
  credits: ReactNode;
}

function ShardInfographics({ title, image, imageAlt, credits }: ShardInfographicsProps) {
  const [noImg, setNoImg] = useState(image === '');
  const { t } = useTranslation('infographicSection');
  useEffect(() => {
    setNoImg(image === '');
  }, [image]);

  return (
    <div className='glass flex w-full min-w-0 max-w-lg flex-col'>
      <h1 className='mb-1 break-words font-extrabold underline'>{title}</h1>
      {noImg ? (
        <div role='alert' className='alert min-w-0 max-w-full'>
          {/* Copied from DaisyUI */}
          <svg
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
            className='h-6 w-6 shrink-0 stroke-current'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth='2'
              d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
            ></path>
          </svg>
          <span>{t('imageError')}</span>
        </div>
      ) : (
        <a href={image} className='block w-full min-w-0 p-0.5' target='_blank' rel='noreferrer'>
          <img
            src={image}
            alt={imageAlt}
            onError={() => setNoImg(true)}
            className='mx-auto block h-auto w-full max-w-full cursor-pointer rounded-md object-contain shadow-lg'
          />
        </a>
      )}
      <small className='block min-w-0 max-w-full break-words'>{credits}</small>
    </div>
  );
}

interface ShardMemoryInfographic {
  remoteDailyConfig?: DailyConfig;
  authorNames?: Record<string, string>;
}

export function ShardMemoryInfographic({ remoteDailyConfig, authorNames }: ShardMemoryInfographic) {
  const { t } = useTranslation(['infographicSection', 'shard']);
  const memory = remoteDailyConfig?.memory;
  if (!memory && memory !== 0) return null;
  const memoryBy = remoteDailyConfig?.memoryBy;
  const author = memoryBy ? authorNames?.[memoryBy] : undefined;
  const imageUrl = withBasePath(`/infographics/memory_clement/${memory}.webp`);
  const memoryStr = t(`shard:memories.${memory}`);
  return (
    <ShardInfographics
      title={`Clement's Shard Memory (${memoryStr})`}
      image={imageUrl}
      imageAlt={memoryStr}
      credits={
        <>
          <a
            href='https://discord.gg/skyinfographicsdatabase'
            className='block max-w-full'
            target='_blank'
            rel='noreferrer'
          >
            <div className='glass tooltip tooltip-top max-w-full' data-tip='Click to join server'>
              <p className='break-words'>
                <strong>Sky: COTL </strong>Infographic Database Discord Server
                <BsDiscord className='ml-1 inline' />
                <BiLinkExternal className='ml-1 inline' />
              </p>
            </div>
          </a>
          {(remoteDailyConfig?.memory || remoteDailyConfig?.memory === 0) && <p>{t('memoryCredit', { author })}</p>}
        </>
      }
    />
  );
}

interface ShardMapInfographic {
  info: ShardInfo;
  remoteDailyConfig?: DailyConfig;
  authorNames?: Record<string, string>;
}

export function ShardMapInfographic({ info, remoteDailyConfig, authorNames }: ShardMapInfographic) {
  const { t } = useTranslation(['infographicSection']);
  const { variation, variationBy } = remoteDailyConfig ?? {};
  const author = variationBy && authorNames?.[variationBy];
  const imageUrl =
    info.numVarient > 1 && (variation || variation === 0)
      ? withBasePath(`/infographics/map_varient_clement/${info.map}.${remoteDailyConfig?.variation}.webp`)
      : withBasePath(`/infographics/map_clement/${info.map}.webp`);
  return (
    <ShardInfographics
      title="Clement's Map"
      image={imageUrl}
      imageAlt={info.map}
      credits={
        <>
          {info.server === 'netease_cn' && <p className='font-semibold'>精确落点待确认 / Exact location unconfirmed</p>}
          <a
            href='https://discord.gg/skyinfographicsdatabase'
            className='block max-w-full'
            target='_blank'
            rel='noreferrer'
          >
            <div className='glass tooltip tooltip-top max-w-full' data-tip='Click to join server'>
              <p className='break-words'>
                <strong>Sky: COTL </strong>Infographic Database Discord Server
                <BsDiscord className='ml-1 inline' />
                <BiLinkExternal className='ml-1 inline' />
              </p>
            </div>
          </a>
          {author && <p>{t('varationCredit', { author })}</p>}
        </>
      }
    />
  );
}

interface ShardDataInfographic {
  info: ShardInfo;
}

export function ShardDataInfographic({ info }: ShardDataInfographic) {
  const data = withBasePath(`/infographics/data_gale/${info.map}.webp`);
  return (
    <ShardInfographics
      title="Gale's Shard Data"
      image={data}
      imageAlt={info.map}
      credits={
        <>
          By <s>Clam</s> <strong>Galerowfylery </strong>
          <BsDiscord className='ml-1 inline' />
        </>
      }
    />
  );
}
