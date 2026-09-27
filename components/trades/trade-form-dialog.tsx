import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountAvatar } from '@/components/accounts/account-avatar';
import { AccountForm } from '@/components/accounts/account-form';
import { useAccounts } from '@/components/accounts/accounts-provider';
import { TradeForm } from '@/components/trades/trade-form';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { toast } from '@/components/ui/toaster';
import { defaultAccountFormValues } from '@/lib/accounts';
import { journalRepo } from '@/lib/storage';
import type {
  AccountFormValues,
  EmotionTag,
  Setup,
  Trade,
  TradeFormValues,
} from '@/lib/types';
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
  const { activeAccount, loading: accountsLoading, refresh: refreshAccounts } =
    useAccounts();
  const editing = trade ?? null;
  const needsAccount = !accountsLoading && !activeAccount;

  async function handleCreateAccount(values: AccountFormValues) {
    try {
      await journalRepo.createAccount(values);
      toast.success(t('toast.accountCreated'));
      await refreshAccounts();
    } catch {
      toast.error(t('toast.error'));
    }
  }

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
        {needsAccount ? (
          <>
            <DialogHeader>
              <DialogTitle>{t('onboarding.title')}</DialogTitle>
              <DialogDescription>{t('trades.needAccount')}</DialogDescription>
            </DialogHeader>
            <AccountForm
              compact={compact}
              defaultValues={defaultAccountFormValues(0)}
              submitLabel={t('onboarding.submit')}
              onCancel={() => onOpenChange(false)}
              onSubmit={handleCreateAccount}
            />
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>
                {title ?? (editing ? t('trades.editTrade') : t('trades.newTrade'))}
              </DialogTitle>
              {activeAccount && (
                <DialogDescription className="flex items-center gap-1.5">
                  {t('trades.account')}:
                  <AccountAvatar account={activeAccount} size="sm" className="size-5" />
                  <span className="font-medium text-foreground">
                    {activeAccount.name}
                  </span>
                </DialogDescription>
              )}
            </DialogHeader>
            <TradeForm
              key={`${activeAccount?.id}-${editing?.id ?? defaultSymbol ?? 'new'}`}
              compact={compact}
              setups={setups}
              emotions={emotions}
              initial={editing ?? undefined}
              defaultSymbol={defaultSymbol}
              onCancel={() => onOpenChange(false)}
              onSubmit={handleSubmit}
              onCaptureScreenshot={onCaptureScreenshot}
            />
          </>
        )}
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
