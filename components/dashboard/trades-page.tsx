import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from '@/components/ui/toaster';
import { DataTable } from '@/components/data-table/data-table';
import { DataTableViewOptions } from '@/components/data-table/data-table-view-options';
import { EmptyState } from '@/components/shared/empty-state';
import { getTradeColumns } from '@/components/trades/columns';
import type { DataTableCustomAction } from '@/components/trades/columns';
import { TradeDetailSheet } from '@/components/trades/trade-detail-sheet';
import { TradeForm } from '@/components/trades/trade-form';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import type { Locale } from '@/lib/schemas';
import { journalRepo } from '@/lib/storage';
import type { EmotionTag, Setup, Trade, TradeFormValues } from '@/lib/types';

export function TradesPage({
  trades,
  setups,
  emotions,
  onChanged,
}: {
  trades: Trade[];
  setups: Setup[];
  emotions: EmotionTag[];
  onChanged: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'fa' ? 'fa' : 'en') as Locale;
  const [selected, setSelected] = useState<Trade | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);

  const handleSave = useCallback(
    async (values: TradeFormValues) => {
      try {
        if (editing) await journalRepo.update(editing.id, values);
        else await journalRepo.create(values);
        toast.success(editing ? t('toast.updated') : t('toast.created'));
        setFormOpen(false);
        setEditing(null);
        onChanged();
      } catch {
        toast.error(t('toast.error'));
      }
    },
    [editing, onChanged, t],
  );

  const handleDelete = useCallback(
    async (trade: Trade) => {
      if (!confirm(t('trades.deleteConfirm'))) return;
      try {
        await journalRepo.delete(trade.id);
        toast.success(t('toast.deleted'));
        setDetailOpen(false);
        setSelected(null);
        onChanged();
      } catch {
        toast.error(t('toast.error'));
      }
    },
    [onChanged, t],
  );

  const handleCloseAtStopLoss = useCallback(
    async (trade: Trade) => {
      try {
        await journalRepo.closeAtStopLoss(trade.id);
        toast.success(t('toast.closedAtStopLoss'));
        onChanged();
      } catch {
        toast.error(t('toast.error'));
      }
    },
    [onChanged, t],
  );

  const handleCloseAtTakeProfit = useCallback(
    async (trade: Trade) => {
      try {
        await journalRepo.closeAtTakeProfit(trade.id);
        toast.success(t('toast.closedAtTakeProfit'));
        onChanged();
      } catch {
        toast.error(t('toast.error'));
      }
    },
    [onChanged, t],
  );

  const openEdit = useCallback((trade: Trade) => {
    setEditing(trade);
    setDetailOpen(false);
    setFormOpen(true);
  }, []);

  const tradeActions = useCallback(
    (trade: Trade): DataTableCustomAction<Trade>[] => {
      if (trade.status === 'closed') return [];
      const actions: DataTableCustomAction<Trade>[] = [];
      if (trade.stopLoss != null) {
        actions.push({
          id: 'close-sl',
          label: t('trades.actions.closeAtStopLoss'),
          icon: <Icon name="arrow-down-circle-line" />,
          variant: 'destructive',
          onClick: handleCloseAtStopLoss,
        });
      }
      if (trade.takeProfit != null) {
        actions.push({
          id: 'close-tp',
          label: t('trades.actions.closeAtTakeProfit'),
          icon: <Icon name="arrow-up-circle-line" />,
          onClick: handleCloseAtTakeProfit,
        });
      }
      return actions;
    },
    [t, handleCloseAtStopLoss, handleCloseAtTakeProfit],
  );

  const columns = useMemo(
    () =>
      getTradeColumns({
        t,
        locale,
        editable: true,
        deletable: true,
        onEdit: openEdit,
        onDelete: handleDelete,
        actions: tradeActions,
      }),
    [t, locale, openEdit, handleDelete, tradeActions],
  );

  if (trades.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Icon name="add-line" />
            {t('trades.newTrade')}
          </Button>
        </div>
        <EmptyState
          title={t('trades.emptyTitle')}
          description={t('trades.emptyDescription')}
          actionLabel={t('trades.newTrade')}
          onAction={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        />
        <Dialog open={formOpen} onOpenChange={setFormOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
            <DialogHeader>
              <DialogTitle>{t('trades.newTrade')}</DialogTitle>
            </DialogHeader>
            <TradeForm
              setups={setups}
              emotions={emotions}
              onCancel={() => setFormOpen(false)}
              onSubmit={handleSave}
            />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={trades}
        initialSorting={[{ id: 'createdAt', desc: true }]}
        onRowClick={(trade) => {
          setSelected(trade);
          setDetailOpen(true);
        }}
        toolbar={(table) => (
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder={t('common.search')}
              value={
                (table.getColumn('symbol')?.getFilterValue() as string) ?? ''
              }
              onChange={(e) =>
                table.getColumn('symbol')?.setFilterValue(e.target.value)
              }
              className="max-w-xs"
            />
            <DataTableViewOptions table={table} />
            <div className="ms-auto">
              <Button
                size="sm"
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                <Icon name="add-line" />
                {t('trades.newTrade')}
              </Button>
            </div>
          </div>
        )}
      />

      <TradeDetailSheet
        trade={selected}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing ? t('trades.editTrade') : t('trades.newTrade')}
            </DialogTitle>
          </DialogHeader>
          <TradeForm
            key={editing?.id ?? 'new'}
            setups={setups}
            emotions={emotions}
            initial={editing ?? undefined}
            onCancel={() => setFormOpen(false)}
            onSubmit={handleSave}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
