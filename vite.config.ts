import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => {
  return {
    // When building for GitHub Pages, assets are served from /Orbit/
    // In dev mode (e.g. AI Studio preview), use root / so live preview runs seamlessly
    base: process.env.VITE_BASE_PATH || (command === 'build' ? '/Orbit/' : '/'),
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
