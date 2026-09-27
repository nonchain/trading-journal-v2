import { useTranslation } from 'react-i18next';
import { AccountForm } from '@/components/accounts/account-form';
import { useAccounts } from '@/components/accounts/accounts-provider';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/toaster';
import { accountToFormValues, defaultAccountFormValues } from '@/lib/accounts';
import { journalRepo } from '@/lib/storage';
import type { Account, AccountFormValues } from '@/lib/types';

export function AccountFormDialog({
  open,
  onOpenChange,
  account,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass an account to edit it; omit to create a new one (which becomes active). */
  account?: Account | null;
}) {
  const { t } = useTranslation();
  const { accounts, refresh } = useAccounts();

  async function handleSubmit(values: AccountFormValues) {
    try {
      if (account) await journalRepo.updateAccount(account.id, values);
      else await journalRepo.createAccount(values);
    } catch {
      toast.error(t('toast.error'));
      return;
    }
    onOpenChange(false);
    toast.success(t(account ? 'toast.accountUpdated' : 'toast.accountCreated'));
    refresh().catch(() => {});
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {account ? t('accounts.edit') : t('accounts.new')}
          </DialogTitle>
        </DialogHeader>
        {open && (
          <AccountForm
            key={account?.id ?? 'new'}
            editing={!!account}
            defaultValues={
              account
                ? accountToFormValues(account)
                : defaultAccountFormValues(accounts.length)
            }
            submitLabel={account ? t('common.save') : t('accounts.create')}
            onCancel={() => onOpenChange(false)}
            onSubmit={handleSubmit}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
