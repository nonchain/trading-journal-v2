import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProviders } from '@/components/providers/app-providers';
import { NewTradeButton } from '@/components/trades/trade-form-dialog';
import { toast } from '@/components/ui/toaster';
import { useJournal } from '@/hooks/use-journal';

function readSymbolFromPage(): string | undefined {
  try {
    const path = window.location.pathname;
    // /chart/.../SYMBOL/ or /symbols/SYMBOL/
    const chartMatch = path.match(/\/chart\/[^/]+\/([^/]+)/i);
    if (chartMatch?.[1]) return decodeURIComponent(chartMatch[1]).toUpperCase();
    const symbolsMatch = path.match(/\/symbols\/([^/]+)/i);
    if (symbolsMatch?.[1]) {
      const raw = decodeURIComponent(symbolsMatch[1]);
      return raw.includes(':') ? raw.split(':').pop()!.toUpperCase() : raw.toUpperCase();
    }
    const title = document.title;
    const titleMatch = title.match(/^([A-Z0-9._-]+)/i);
    if (titleMatch?.[1] && titleMatch[1].length <= 16) {
      return titleMatch[1].toUpperCase();
    }
  } catch {
    // ignore
  }
  return undefined;
}

function ContentUiInner() {
  const { t } = useTranslation();
  const { setups, emotions, refresh } = useJournal();
  const [symbol, setSymbol] = useState<string | undefined>();

  useEffect(() => {
    setSymbol(readSymbolFromPage());
    const id = window.setInterval(() => setSymbol(readSymbolFromPage()), 3000);
    return () => window.clearInterval(id);
  }, []);

  async function captureScreenshot() {
    try {
      const res = (await browser.runtime.sendMessage({
        type: 'CAPTURE_SCREENSHOT',
      })) as { dataUrl?: string; error?: string };
      if (res?.error) throw new Error(res.error);
      return res?.dataUrl;
    } catch {
      toast.error(t('toast.error'));
      return undefined;
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        right: 16,
        bottom: 88,
        zIndex: 2147483646,
      }}
    >
      <NewTradeButton
        compact
        className="shadow-lg"
        label={t('content.logTrade')}
        title={t('trades.logTrade')}
        contentClassName="max-h-[85vh] sm:max-w-md"
        defaultSymbol={symbol}
        setups={setups}
        emotions={emotions}
        onSaved={refresh}
        onCaptureScreenshot={captureScreenshot}
      />
    </div>
  );
}

export function ContentUi() {
  return (
    <AppProviders compact scoped>
      <ContentUiInner />
    </AppProviders>
  );
}
