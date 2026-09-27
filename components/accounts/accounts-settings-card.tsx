import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountAvatar } from '@/components/accounts/account-avatar';
import { AccountFormDialog } from '@/components/accounts/account-form-dialog';
import { useAccounts } from '@/components/accounts/accounts-provider';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { NumberValue } from '@/components/ui/number-value';
import { toast } from '@/components/ui/toaster';
import { useLocale } from '@/hooks/use-locale';
import { journalRepo } from '@/lib/storage';
import type { Account } from '@/lib/types';

export function AccountsSettingsCard() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const { accounts, activeAccount, balances, switchAccount, refresh } = useAccounts();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [deleting, setDeleting] = useState<{ account: Account; trades: number } | null>(
    null,
  );

  async function confirmDelete() {
    if (!deleting) return;
    try {
      await journalRepo.deleteAccount(deleting.account.id);
      await refresh();
      toast.success(t('toast.accountDeleted'));
    } catch {
      toast.error(t('toast.error'));
    } finally {
      setDeleting(null);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base">{t('accounts.title')}</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Icon name="add-line" />
          {t('accounts.new')}
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {accounts.map((account) => {
          const active = account.id === activeAccount?.id;
          return (
            <div
              key={account.id}
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{ borderInlineStartColor: account.color, borderInlineStartWidth: 3 }}
            >
              <AccountAvatar account={account} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate font-medium">{account.name}</span>
                  {active && <Badge variant="secondary">{t('accounts.active')}</Badge>}
                </div>
                <p className="text-xs text-muted-foreground">
                  {account.currency} · {t('accounts.fields.initial')}{' '}
                  <NumberValue
                    value={account.initialBalance}
                    variant="currency"
                    currency={account.currency}
                    locale={locale}
                  />
                </p>
              </div>
              <NumberValue
                value={balances[account.id]}
                variant="currency"
                currency={account.currency}
                locale={locale}
                className="hidden text-sm font-semibold sm:inline"
              />
              <div className="flex items-center">
                {!active && (
                  <Button
                    size="icon"
                    variant="ghost"
                    title={t('accounts.switch')}
                    onClick={() => switchAccount(account.id)}
                  >
                    <Icon name="arrow-up-down-line" />
                  </Button>
                )}
                <Button
                  size="icon"
                  variant="ghost"
                  title={t('accounts.edit')}
                  onClick={() => {
                    setEditing(account);
                    setFormOpen(true);
                  }}
                >
                  <Icon name="pencil-line" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  title={t('accounts.delete')}
                  onClick={async () =>
                    setDeleting({
                      account,
                      trades: await journalRepo.countTrades(account.id),
                    })
                  }
                >
                  <Icon name="delete-bin-line" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>

      <AccountFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        account={editing}
      />

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {t('accounts.deleteConfirmTitle', { name: deleting?.account.name })}
            </DialogTitle>
            <DialogDescription>
              {t('accounts.deleteConfirmDescription', { count: deleting?.trades ?? 0 })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDeleting(null)}>
              {t('common.cancel')}
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              {t('common.delete')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
