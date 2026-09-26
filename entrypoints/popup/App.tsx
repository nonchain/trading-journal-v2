import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TradeCard } from '@/components/trades/trade-card';
import { TradeForm } from '@/components/trades/trade-form';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';
import { useJournal } from '@/hooks/use-journal';
import { journalRepo } from '@/lib/storage';
import type { TradeFormValues } from '@/lib/types';

export function PopupApp() {
  const { t } = useTranslation();
  const { trades, setups, emotions, loading, refresh } = useJournal();
  const [open, setOpen] = useState(false);
  const recent = trades.slice(0, 5);

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
    <div className="flex min-h-[460px] flex-col bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{t('popup.title')}</p>
          <h1 className="text-base font-semibold">{t('app.name')}</h1>
        </div>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Icon name="add-line" />
          {t('trades.newTrade')}
        </Button>
      </div>

      <div className="mb-3 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => browser.runtime.openOptionsPage()}
        >
          <Icon name="external-link-line" />
          {t('common.openDashboard')}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() =>
            browser.runtime.sendMessage({ type: 'OPEN_SIDEPANEL' })
          }
        >
          <Icon name="layout-right-line" />
          {t('common.openSidebar')}
        </Button>
      </div>

      <p className="mb-2 text-xs font-medium text-muted-foreground">
        {t('trades.recent')}
      </p>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : recent.length === 0 ? (
        <EmptyState
          title={t('trades.emptyTitle')}
          description={t('trades.emptyDescription')}
          actionLabel={t('trades.newTrade')}
          onAction={() => setOpen(true)}
        />
      ) : (
        <div className="space-y-2 overflow-auto">
          {recent.map((trade) => (
            <TradeCard key={trade.id} trade={trade} compact />
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('trades.newTrade')}</DialogTitle>
          </DialogHeader>
          <TradeForm
            compact
            setups={setups}
            emotions={emotions}
            onCancel={() => setOpen(false)}
            onSubmit={handleCreate}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
