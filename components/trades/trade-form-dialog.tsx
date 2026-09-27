import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TradeForm } from '@/components/trades/trade-form';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toaster';
import { journalRepo } from '@/lib/storage';
import type { EmotionTag, Setup, Trade, TradeFormValues } from '@/lib/types';
import { cn } from '@/lib/utils';

export type TradeFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setups: Setup[];
  emotions: EmotionTag[];
  /** Pass a trade to edit it; omit to create a new one. */
  trade?: Trade | null;
  /** Overrides the default "New Trade" / "Edit Trade" title. */
  title?: string;
  compact?: boolean;
  defaultSymbol?: string;
  onCaptureScreenshot?: () => Promise<string | undefined>;
  /** Called after a successful create/update. */
  onSaved?: (trade: Trade) => void;
  contentClassName?: string;
};

export function TradeFormDialog({
  open,
  onOpenChange,
  setups,
  emotions,
  trade,
  title,
  compact,
  defaultSymbol,
  onCaptureScreenshot,
  onSaved,
  contentClassName,
}: TradeFormDialogProps) {
  const { t } = useTranslation();
  const editing = trade ?? null;

  async function handleSubmit(values: TradeFormValues) {
    try {
      const saved = editing
        ? await journalRepo.update(editing.id, values)
        : await journalRepo.create(values);
      toast.success(editing ? t('toast.updated') : t('toast.created'));
      onOpenChange(false);
      onSaved?.(saved);
    } catch {
      toast.error(t('toast.error'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-h-[90vh] overflow-y-auto',
          !compact && 'sm:max-w-xl',
          contentClassName,
        )}
      >
        <DialogHeader>
          <DialogTitle>
            {title ?? (editing ? t('trades.editTrade') : t('trades.newTrade'))}
          </DialogTitle>
        </DialogHeader>
        <TradeForm
          key={editing?.id ?? defaultSymbol ?? 'new'}
          compact={compact}
          setups={setups}
          emotions={emotions}
          initial={editing ?? undefined}
          defaultSymbol={defaultSymbol}
          onCancel={() => onOpenChange(false)}
          onSubmit={handleSubmit}
          onCaptureScreenshot={onCaptureScreenshot}
        />
      </DialogContent>
    </Dialog>
  );
}

export type NewTradeButtonProps = Omit<
  TradeFormDialogProps,
  'open' | 'onOpenChange' | 'trade'
> & {
  /** Controlled open state — lets other triggers (e.g. empty states) open the same dialog. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Button text. Defaults to "New Trade". */
  label?: string;
  size?: ButtonProps['size'];
  variant?: ButtonProps['variant'];
  className?: string;
};

export function NewTradeButton({
  open: openProp,
  onOpenChange,
  label,
  size = 'sm',
  variant,
  className,
  ...dialogProps
}: NewTradeButtonProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const open = openProp ?? internalOpen;

  function setOpen(next: boolean) {
    if (openProp === undefined) setInternalOpen(next);
    onOpenChange?.(next);
  }

  return (
    <>
      <Button
        size={size}
        variant={variant}
        className={className}
        onClick={() => setOpen(true)}
      >
        <Icon name="add-line" />
        {label ?? t('trades.newTrade')}
      </Button>
      <TradeFormDialog {...dialogProps} open={open} onOpenChange={setOpen} />
    </>
  );
}
