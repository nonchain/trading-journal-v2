import path from 'node:path';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  alias: {
    '@': path.resolve(__dirname, '.'),
  },
  vite: () => ({
    plugins: [tailwindcss()],
  }),
  manifest: {
    name: 'TV Trade Journal',
    description: 'Trade journaling alongside TradingView',
    permissions: ['storage', 'sidePanel', 'tabs'],
    host_permissions: ['*://*.tradingview.com/*'],
    action: {
      default_title: 'TV Trade Journal',
    },
  },
});
