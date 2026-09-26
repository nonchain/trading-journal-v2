import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppProviders } from '@/components/providers/app-providers';
import { TradeForm } from '@/components/trades/trade-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toaster';
import { useJournal } from '@/hooks/use-journal';
import { journalRepo } from '@/lib/storage';
import type { TradeFormValues } from '@/lib/types';

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
  const [open, setOpen] = useState(false);
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

  async function handleCreate(values: TradeFormValues) {
    try {
      await journalRepo.create(values);
      toast.success(t('toast.created'));
      setOpen(false);
      refresh();
    } catch {
      toast.error(t('toast.error'));
    }
  }

  return (
    <>
      <div
        style={{
          position: 'fixed',
          right: 16,
          bottom: 88,
          zIndex: 2147483646,
        }}
      >
        <Button
          size="sm"
          className="shadow-lg"
          onClick={() => setOpen(true)}
        >
          <Icon name="add-line" />
          {t('content.logTrade')}
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('trades.logTrade')}</DialogTitle>
          </DialogHeader>
          <TradeForm
            key={symbol ?? 'nosymbol'}
            compact
            defaultSymbol={symbol}
            setups={setups}
            emotions={emotions}
            onCancel={() => setOpen(false)}
            onSubmit={handleCreate}
            onCaptureScreenshot={captureScreenshot}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ContentUi() {
  return (
    <AppProviders compact>
      <ContentUiInner />
    </AppProviders>
  );
}
