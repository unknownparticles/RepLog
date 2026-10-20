import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import pkg from './package.json' with { type: 'json' };
import { pagesBase } from './scripts/build-context.mjs';

const base = pagesBase();
let sha = process.env.GITHUB_SHA || 'local';
try { sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim(); } catch { /* 源码压缩包没有 Git 元数据 */ }

export default defineConfig({
  base,
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_SHA__: JSON.stringify(sha.slice(0, 7)),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
  plugins: [react(), VitePWA({
    registerType: 'prompt',
    includeAssets: ['icon.svg', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'],
    manifest: {
      id: base, name: 'RepLog 健身日历', short_name: 'RepLog',
      description: '把每一餐、每一次训练，记进你的日常。', lang: 'zh-CN',
      theme_color: '#217a56', background_color: '#f6f7f3',
      display: 'standalone', start_url: base, scope: base,
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
      navigateFallback: 'index.html', cleanupOutdatedCaches: true, clientsClaim: true,
      maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    },
  })],
});
