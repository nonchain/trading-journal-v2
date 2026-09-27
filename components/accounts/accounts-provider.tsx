import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NumberCurrencyProvider } from '@/components/ui/number-value';
import { journalRepo } from '@/lib/storage';
import type { Account } from '@/lib/types';

interface AccountsContextValue {
  accounts: Account[];
  activeAccount: Account | null;
  /** Initial balance + realized P&L, keyed by account id. */
  balances: Record<string, number>;
  loading: boolean;
  switchAccount: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AccountsContext = createContext<AccountsContextValue | null>(null);

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeAccount, setActiveAccount] = useState<Account | null>(null);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [list, active, bal] = await Promise.all([
      journalRepo.getAccounts(),
      journalRepo.getActiveAccount(),
      journalRepo.getAccountBalances(),
    ]);
    setAccounts(list);
    setActiveAccount(active);
    setBalances(bal);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const unwatchAccounts = journalRepo.watchAccounts(() => refresh());
    const unwatchSettings = journalRepo.watchSettings(() => refresh());
    const unwatchTrades = journalRepo.watchTrades(() => refresh());
    return () => {
      unwatchAccounts();
      unwatchSettings();
      unwatchTrades();
    };
  }, [refresh]);

  const switchAccount = useCallback(
    async (id: string) => {
      await journalRepo.setActiveAccount(id);
      await refresh();
    },
    [refresh],
  );

  const value = useMemo(
    () => ({ accounts, activeAccount, balances, loading, switchAccount, refresh }),
    [accounts, activeAccount, balances, loading, switchAccount, refresh],
  );

  return (
    <AccountsContext.Provider value={value}>
      <NumberCurrencyProvider currency={activeAccount?.currency}>
        {children}
      </NumberCurrencyProvider>
    </AccountsContext.Provider>
  );
}

export function useAccounts(): AccountsContextValue {
  const ctx = useContext(AccountsContext);
  if (!ctx) throw new Error('useAccounts must be used within AccountsProvider');
  return ctx;
}
