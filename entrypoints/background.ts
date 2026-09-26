import { journalRepo } from '@/lib/storage';
import type { MessageType } from '@/lib/types';

async function updateBadge() {
  try {
    const trades = await journalRepo.getAll();
    const openCount = trades.filter((t) => t.status === 'open').length;
    const text = openCount > 0 ? String(openCount) : '';
    await browser.action.setBadgeText({ text });
    await browser.action.setBadgeBackgroundColor({ color: '#3B82F6' });
  } catch {
    // Badge API may be unavailable on some browsers during install.
  }
}

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'install') {
      await browser.runtime.openOptionsPage();
    }
    await updateBadge();
  });

  browser.runtime.onMessage.addListener(
    (message: MessageType, sender, sendResponse) => {
      if (message.type === 'TRADES_CHANGED') {
        updateBadge();
        return;
      }

      if (message.type === 'OPEN_SIDEPANEL') {
        (async () => {
          try {
            const win = await browser.windows.getCurrent();
            if (win.id != null && browser.sidePanel?.open) {
              await browser.sidePanel.open({ windowId: win.id });
            }
          } catch (error) {
            console.error('Failed to open side panel', error);
          }
        })();
        return;
      }

      if (message.type === 'OPEN_OPTIONS') {
        browser.runtime.openOptionsPage();
        return;
      }

      if (message.type === 'CAPTURE_SCREENSHOT') {
        (async () => {
          try {
            const tabId = message.tabId ?? sender.tab?.id;
            let windowId = sender.tab?.windowId;
            if (windowId == null && tabId != null) {
              const tab = await browser.tabs.get(tabId);
              windowId = tab.windowId;
            }
            if (windowId == null) {
              sendResponse({
                type: 'CAPTURE_SCREENSHOT_RESULT',
                error: 'No window',
              });
              return;
            }
            const dataUrl = await browser.tabs.captureVisibleTab(windowId, {
              format: 'jpeg',
              quality: 70,
            });
            sendResponse({
              type: 'CAPTURE_SCREENSHOT_RESULT',
              dataUrl,
            });
          } catch (error) {
            sendResponse({
              type: 'CAPTURE_SCREENSHOT_RESULT',
              error: error instanceof Error ? error.message : 'Capture failed',
            });
          }
        })();
        return true;
      }

      if (message.type === 'GET_BADGE_COUNT') {
        updateBadge();
      }
    },
  );

  updateBadge();
});
