import type { Account, AccountFormValues } from './schemas';

export const ACCOUNT_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CHF',
  'CAD',
  'AUD',
  'USDT',
  'USDC',
] as const;

export const ACCOUNT_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#EC4899',
  '#EF4444',
  '#F59E0B',
  '#22C55E',
  '#14B8A6',
  '#06B6D4',
  '#64748B',
] as const;

export const ACCOUNT_ICONS = [
  'wallet-3-line',
  'bank-line',
  'briefcase-4-line',
  'safe-2-line',
  'coin-line',
  'bit-coin-line',
  'exchange-dollar-line',
  'line-chart-line',
  'stock-line',
  'rocket-2-line',
  'trophy-line',
  'shield-star-line',
  'flask-line',
  'fire-line',
  'vip-crown-line',
  'global-line',
] as const;

const NON_ISO_CURRENCY_NAMES: Record<string, string> = {
  USDT: 'Tether',
  USDC: 'USD Coin',
};

export function currencyName(code: string, locale: string): string {
  const fixed = NON_ISO_CURRENCY_NAMES[code];
  if (fixed) return fixed;
  try {
    return new Intl.DisplayNames([locale], { type: 'currency' }).of(code) ?? code;
  } catch {
    return code;
  }
}

export function defaultAccountFormValues(
  existingCount: number,
): AccountFormValues {
  return {
    name: '',
    initialBalance: undefined as unknown as number,
    currency: 'USD',
    icon: undefined,
    color: ACCOUNT_COLORS[existingCount % ACCOUNT_COLORS.length] ?? ACCOUNT_COLORS[0],
  };
}

export function accountToFormValues(account: Account): AccountFormValues {
  return {
    name: account.name,
    initialBalance: account.initialBalance,
    currency: account.currency,
    icon: account.icon,
    color: account.color,
  };
}
