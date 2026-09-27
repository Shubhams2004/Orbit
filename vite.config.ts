import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rawBasePath = process.env.VITE_BASE_PATH ?? env.VITE_BASE_PATH;
  const basePath =
    rawBasePath !== undefined
      ? rawBasePath
      : process.env.CF_PAGES
      ? '/'
      : command === 'build'
      ? '/Orbit/'
      : '/';

  return {
    // When building for GitHub Pages, assets are served from /Orbit/
    // When building for Cloudflare Pages or when explicitly overridden, base is '/'
    // In dev mode (e.g. AI Studio preview), use root / so live preview runs seamlessly
    base: basePath,
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
