import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AccountForm } from '@/components/accounts/account-form';
import { useAccounts } from '@/components/accounts/accounts-provider';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/toaster';
import { defaultAccountFormValues } from '@/lib/accounts';
import { journalRepo } from '@/lib/storage';
import type { AccountFormValues } from '@/lib/types';
import { cn } from '@/lib/utils';

/** First-run step: the journal needs an account before any trade can be logged. */
export function AccountOnboarding({
  compact,
  className,
}: {
  compact?: boolean;
  className?: string;
}) {
  const { t } = useTranslation();
  const { refresh } = useAccounts();

  async function handleSubmit(values: AccountFormValues) {
    try {
      await journalRepo.createAccount(values);
      toast.success(t('toast.accountCreated'));
      await refresh();
    } catch {
      toast.error(t('toast.error'));
    }
  }

  return (
    <Card className={cn('w-full', !compact && 'max-w-lg', className)}>
      <CardHeader className={compact ? 'p-3' : 'p-6 pb-4'}>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/15 text-xl text-primary">
          <Icon name="wallet-3-line" />
        </div>
        <CardTitle className={compact ? 'text-base' : 'text-xl'}>
          {t('onboarding.title')}
        </CardTitle>
        <CardDescription>{t('onboarding.description')}</CardDescription>
      </CardHeader>
      <CardContent className={compact ? 'p-3 pt-0' : 'p-6 pt-0'}>
        <AccountForm
          compact={compact}
          defaultValues={defaultAccountFormValues(0)}
          submitLabel={t('onboarding.submit')}
          onSubmit={handleSubmit}
        />
      </CardContent>
    </Card>
  );
}

/** Renders children only once at least one account exists. */
export function AccountGate({
  children,
  compact,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  const { accounts, loading } = useAccounts();

  if (loading) {
    return (
      <div className="space-y-2 p-3">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (accounts.length === 0) {
    return <AccountOnboarding compact={compact} className="border-0 shadow-none" />;
  }

  return <>{children}</>;
}
