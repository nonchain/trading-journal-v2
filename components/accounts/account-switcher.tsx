import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountAvatar } from '@/components/accounts/account-avatar';
import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { useAccounts } from '@/components/accounts/accounts-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import { NumberValue } from '@/components/ui/number-value';
import { toast } from '@/components/ui/toaster';
import { useLocale } from '@/hooks/use-locale';
import { cn } from '@/lib/utils';

export function AccountSwitcher({
  compact,
  onManage,
  className,
}: {
  /** Hide the balance line in the trigger. */
  compact?: boolean;
  onManage?: () => void;
  className?: string;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { accounts, activeAccount, balances, switchAccount } = useAccounts();
  const [createOpen, setCreateOpen] = useState(false);

  if (!activeAccount) return null;

  return (
    <>
      <DropdownMenu dir={locale === 'fa' ? 'rtl' : 'ltr'} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className={cn('h-auto min-w-0 gap-2 px-2 py-1.5', className)}
            aria-label={t('accounts.switch')}
          >
            <AccountAvatar account={activeAccount} size={compact ? 'sm' : 'md'} />
            <span className="flex min-w-0 flex-1 flex-col items-start text-start">
              <span className="max-w-full truncate text-sm font-semibold">
                {activeAccount.name}
              </span>
              {!compact && (
                <NumberValue
                  value={balances[activeAccount.id]}
                  variant="currency"
                  currency={activeAccount.currency}
                  locale={locale}
                  className="text-xs font-normal text-muted-foreground"
                />
              )}
            </span>
            <Icon name="expand-up-down-line" className="text-muted-foreground" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          <DropdownMenuLabel>{t('accounts.title')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup
            value={activeAccount.id}
            onValueChange={async (id) => {
              try {
                await switchAccount(id);
              } catch {
                toast.error(t('toast.error'));
              }
            }}
          >
            {accounts.map((account) => (
              <DropdownMenuRadioItem key={account.id} value={account.id}>
                <AccountAvatar account={account} size="sm" />
                <span className="min-w-0 flex-1 truncate">{account.name}</span>
                <NumberValue
                  value={balances[account.id]}
                  variant="currency"
                  currency={account.currency}
                  locale={locale}
                  decimals={0}
                  className="text-xs text-muted-foreground"
                />
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
            <Icon name="add-circle-line" />
            {t('accounts.new')}
          </DropdownMenuItem>
          {onManage && (
            <DropdownMenuItem onSelect={onManage}>
              <Icon name="settings-4-line" />
              {t('accounts.manage')}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <AccountFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </>
  );
}
