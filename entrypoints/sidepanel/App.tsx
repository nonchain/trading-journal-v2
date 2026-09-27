import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EmptyState } from '@/components/shared/empty-state';
import { TradeCard } from '@/components/trades/trade-card';
import { TradeDetailSheet } from '@/components/trades/trade-detail-sheet';
import { NewTradeButton } from '@/components/trades/trade-form-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useJournal } from '@/hooks/use-journal';
import { filterTrades } from '@/lib/stats';
import type { Trade, TradeFilter } from '@/lib/types';
import { cn } from '@/lib/utils';

export function SidepanelApp() {
  const { t } = useTranslation();
  const { trades, setups, emotions, loading, refresh } = useJournal();
  const [filter, setFilter] = useState<TradeFilter>({ kind: 'all' });
  const [formOpen, setFormOpen] = useState(false);
  const [selected, setSelected] = useState<Trade | null>(null);

  const filtered = useMemo(
    () => filterTrades(trades, filter).slice(0, 30),
    [trades, filter],
  );

  const chips: Array<{ label: string; value: TradeFilter }> = [
    { label: t('common.all'), value: { kind: 'all' } },
    { label: t('common.today'), value: { kind: 'today' } },
    { label: t('common.thisWeek'), value: { kind: 'week' } },
    ...setups.slice(0, 4).map((s) => ({
      label: s.name,
      value: { kind: 'setup' as const, setupTag: s.name },
    })),
  ];

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="border-b px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground">
              {t('sidepanel.title')}
            </p>
            <h1 className="text-base font-semibold">{t('app.name')}</h1>
          </div>
          <NewTradeButton
            compact
            open={formOpen}
            onOpenChange={setFormOpen}
            setups={setups}
            emotions={emotions}
            onSaved={refresh}
          />
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 w-full justify-start"
          onClick={() => browser.runtime.openOptionsPage()}
        >
          <Icon name="external-link-line" />
          {t('common.openDashboard')}
        </Button>
      </header>

      <div className="flex flex-wrap gap-1.5 border-b px-3 py-2">
        {chips.map((chip) => {
          const active = JSON.stringify(chip.value) === JSON.stringify(filter);
          return (
            <button
              key={chip.label}
              type="button"
              onClick={() => setFilter(chip.value)}
            >
              <Badge
                variant={active ? 'default' : 'outline'}
                className={cn('cursor-pointer', !active && 'bg-transparent')}
              >
                {chip.label}
              </Badge>
            </button>
          );
        })}
      </div>

      <ScrollArea className="flex-1 px-3 py-3">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t('trades.emptyTitle')}
            description={t('trades.emptyDescription')}
            actionLabel={t('trades.newTrade')}
            onAction={() => setFormOpen(true)}
          />
        ) : (
          <div className="space-y-2">
            {filtered.map((trade) => (
              <TradeCard
                key={trade.id}
                trade={trade}
                compact
                onClick={() => setSelected(trade)}
              />
            ))}
          </div>
        )}
      </ScrollArea>

      <TradeDetailSheet
        trade={selected}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
      />
    </div>
  );
}
