import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TradeCard } from '@/components/trades/trade-card';
import { NewTradeButton } from '@/components/trades/trade-form-dialog';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { EmptyState } from '@/components/shared/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournal } from '@/hooks/use-journal';

export function PopupApp() {
  const { t } = useTranslation();
  const { trades, setups, emotions, loading, refresh } = useJournal();
  const [open, setOpen] = useState(false);
  const recent = trades.slice(0, 5);

  return (
    <div className="flex min-h-[460px] flex-col bg-background p-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">{t('popup.title')}</p>
          <h1 className="text-base font-semibold">{t('app.name')}</h1>
        </div>
        <NewTradeButton
          compact
          open={open}
          onOpenChange={setOpen}
          setups={setups}
          emotions={emotions}
          onSaved={refresh}
        />
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
    </div>
  );
}
