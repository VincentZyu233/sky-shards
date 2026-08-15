import react from '@vitejs/plugin-react-swc';
import { readFile, stat } from 'fs/promises';
import { defineConfig, normalizePath } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import createManifest from './manifest';
import packageJson from './package.json';

function normalizeBase(base: string) {
  const path = base.trim().replace(/^\/+|\/+$/g, '');
  return path ? `/${path}/` : '/';
}

const base = normalizeBase(process.env.DEPLOY_BASE ?? '/');

process.env.VITE_VERSION = packageJson.version;
const gitBranch = process.env.CF_PAGES_BRANCH ?? process.env.GITHUB_REF_NAME;
const gitCommit = process.env.CF_PAGES_COMMIT_SHA ?? process.env.GITHUB_SHA;
if (gitBranch) process.env.VITE_GIT_BRANCH = gitBranch;
if (gitCommit) process.env.VITE_GIT_COMMIT = gitCommit;

console.log('Version', process.env.VITE_VERSION);
console.log('Branch', process.env.VITE_GIT_BRANCH);
console.log('Commit Ref', process.env.VITE_GIT_COMMIT);

const translationJsonUrl =
  'https://script.google.com/macros/s/AKfycbxWmAhleoWLtyVpXgICkkGUdAZKi_JPkuSxJ243H33316scaRFgY0kEq6UR3iPajsq4/exec';

process.env.VITE_GS_TRANSLATION_URL = translationJsonUrl;

if (!process.env.VITE_SHARD_REMOTE_URL) {
  process.env.VITE_SHARD_REMOTE_URL = 'https://sky-shardfig.plutoy.top';
}

// Check if the translation file (locales.json) exists
try {
  await stat(normalizePath('./src/i18n/locales.json'));
} catch (e) {
  console.error('locales.json not found, run pnpm downloadTrans to download it');
  process.exit(1);
}

// https://vitejs.dev/config/
export default defineConfig({
  base,
  server: {
    watch: {
      ignored: ['**/temp/**', '**/tmp/**'],
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'i18n': ['i18next', 'react-i18next', './src/i18n/index.tsx'],
        },
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'favicon.ico',
        'fonts/*',
        'backgrounds/*',
        'icons/*',
        'infographics/**/*.webp',
        'emojis/*.webp',
        'ext/*',
      ],
      manifest: createManifest(base),
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'cloudflare-insights',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
            },
          },
        ],
      },
    }),
    {
      name: 'edit_headers',
      async buildEnd() {
        const additionalConnectSrc = [
          'https://script.googleusercontent.com/macros/echo',
          process.env.VITE_GS_TRANSLATION_URL,
          process.env.VITE_SHARD_REMOTE_URL,
        ].join(' ');
        const premadeHeaders = await readFile('./src/_headers', 'utf-8');
        const headers = premadeHeaders.replace('${addConnectSrc}', additionalConnectSrc);
        this.emitFile({ type: 'asset', fileName: '_headers', source: headers });
        console.log('dis/allowed connect-src:', additionalConnectSrc);
      },
    },
  ],
});
