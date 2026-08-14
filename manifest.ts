import type { ManifestOptions } from 'vite-plugin-pwa';

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

export function createManifest(base: string): Partial<ManifestOptions> {
  const withBase = (path: string) => `${base}${path.replace(/^\//, '')}`;
  const shortcutsIcon = iconSizes.map(size => ({
    src: withBase(`/icons/icon-${size}x${size}.png`),
    sizes: `${size}x${size}`,
    type: 'image/png',
    purpose: 'maskable any',
  }));

  return {
    name: 'Sky Shards',
    short_name: 'Sky Shards',
    description: `Shard Eruption in the game 'Sky: Children of the Light'`,
    theme_color: '#8a76b1',
    background_color: '#8a76b1',
    display: 'standalone',
    start_url: base,
    scope: base,
    shortcuts: [
      {
        name: 'Next Shard',
        short_name: 'Next Shard',
        url: withBase('/next'),
        icons: shortcutsIcon,
      },
      {
        name: 'Next Red Shard',
        short_name: 'Next Red Shard',
        url: withBase('/next/red'),
        icons: shortcutsIcon,
      },
      {
        name: 'Next Black Shard',
        short_name: 'Next Black Shard',
        url: withBase('/next/black'),
        icons: shortcutsIcon,
      },
    ],
    icons: [
      {
        src: withBase('/favicon.ico'),
        sizes: '64x64 32x32 24x24 16x16',
        type: 'image/x-icon',
      },
      {
        src: withBase('/icons/android-chrome-192x192.png'),
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: withBase('/icons/android-chrome-512x512.png'),
        sizes: '512x512',
        type: 'image/png',
      },
      ...shortcutsIcon,
    ],
  };
}

export default createManifest;
