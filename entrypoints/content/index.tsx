import { createRoot } from 'react-dom/client';
import { ContentUi } from './ui';
import '@/assets/styles/globals.css';

export default defineContentScript({
  matches: ['*://*.tradingview.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'tv-trade-journal',
      position: 'inline',
      anchor: 'body',
      append: 'last',
      onMount(container) {
        const mount = document.createElement('div');
        mount.id = 'tv-journal-root';
        container.append(mount);
        const root = createRoot(mount);
        root.render(<ContentUi />);
        return root;
      },
      onRemove(root) {
        root?.unmount();
      },
    });
    ui.mount();
  },
});
