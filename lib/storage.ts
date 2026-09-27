import { storage } from 'wxt/utils/storage';
import { now, toIsoString, toUnix } from './date';
import {
  accountSchema,
  emotionTagSchema,
  journalExportSchema,
  settingsSchema,
  setupSchema,
  tradeSchema,
  type Account,
  type AccountFormValues,
  type EmotionTag,
  type JournalExport,
  type Settings,
  type Setup,
  type Trade,
  type TradeFormValues,
} from './schemas';
import {
  computePosition,
  MIN_LEVERAGE,
  needsQuoteRate,
  tradeMarket,
} from './markets';
import { computeStats } from './stats';
import type { JournalStats } from './types';
import { uid } from './utils';

const tradesItem = storage.defineItem<Trade[]>('local:trades', {
  fallback: [],
});

const setupsItem = storage.defineItem<Setup[]>('local:setups', {
  fallback: [
    { id: 'setup_breakout', name: 'Breakout', color: '#3B82F6' },
    { id: 'setup_reversal', name: 'Reversal', color: '#8B5CF6' },
    { id: 'setup_pullback', name: 'Pullback', color: '#14B8A6' },
  ],
});

const emotionsItem = storage.defineItem<EmotionTag[]>('local:emotionTags', {
  fallback: [
    { id: 'emo_calm', name: 'Calm', color: '#22C55E' },
    { id: 'emo_fomo', name: 'FOMO', color: '#F59E0B' },
    { id: 'emo_revenge', name: 'Revenge', color: '#EF4444' },
    { id: 'emo_confident', name: 'Confident', color: '#06B6D4' },
  ],
});

const settingsItem = storage.defineItem<Settings>('local:settings', {
  fallback: { locale: 'fa', theme: 'dark', currency: 'USD' },
});

const accountsItem = storage.defineItem<Account[]>('local:accounts', {
  fallback: [],
});

function sortNewestFirst(trades: Trade[]) {
  return [...trades].sort((a, b) => toUnix(b.createdAt) - toUnix(a.createdAt));
}

function pickActiveAccount(
  accounts: Account[],
  activeAccountId: string | undefined,
): Account | null {
  return accounts.find((a) => a.id === activeAccountId) ?? accounts[0] ?? null;
}

/** Fire-and-forget: a pending or failed broadcast must never block a storage write. */
async function notifyChanged() {
  try {
    browser.runtime.sendMessage({ type: 'TRADES_CHANGED' }).catch(() => {});
  } catch {
    // No listeners in some contexts — safe to ignore.
  }
}

function optionalNumber(value: number | undefined) {
  return value != null && !Number.isNaN(value) ? value : undefined;
}

function resolveExitPrice(
  values: TradeFormValues,
  existing: Trade | undefined,
  status: Trade['status'],
  stopLoss: number | undefined,
  takeProfit: number | undefined,
): number | undefined {
  const closeReason = status === 'closed'
    ? values.closeReason ?? existing?.closeReason
    : undefined;

  if (status === 'closed' && closeReason === 'stopLoss' && stopLoss != null) {
    return stopLoss;
  }
  if (status === 'closed' && closeReason === 'takeProfit' && takeProfit != null) {
    return takeProfit;
  }

  // Legacy closed trades (no closeReason): if exit matched the old SL/TP, keep them linked.
  const exitPrice = optionalNumber(values.exitPrice);
  if (
    status === 'closed' &&
    !closeReason &&
    existing?.exitPrice != null
  ) {
    if (
      existing.stopLoss != null &&
      existing.exitPrice === existing.stopLoss &&
      stopLoss != null
    ) {
      return stopLoss;
    }
    if (
      existing.takeProfit != null &&
      existing.exitPrice === existing.takeProfit &&
      takeProfit != null
    ) {
      return takeProfit;
    }
  }

  return exitPrice;
}

function toTrade(
  values: TradeFormValues,
  existing: Trade | undefined,
  account: Pick<Account, 'id' | 'currency'>,
): Trade {
  const stopLoss = optionalNumber(values.stopLoss);
  const takeProfit = optionalNumber(values.takeProfit);

  const status =
    values.status ??
    (optionalNumber(values.exitPrice) != null
      ? 'closed'
      : existing?.status ?? 'open');

  const exitPrice = resolveExitPrice(
    values,
    existing,
    status,
    stopLoss,
    takeProfit,
  );

  const leverage = optionalNumber(values.leverage);
  const quoteRate = needsQuoteRate(values.symbol, values.market, account.currency)
    ? optionalNumber(values.quoteRate)
    : undefined;

  // Form doesn't edit risk directly — always derive from stop when available
  // so correcting SL after close refreshes R-multiple.
  const metrics = computePosition({
    market: values.market,
    symbol: values.symbol,
    direction: values.direction,
    entryPrice: values.entryPrice,
    exitPrice,
    stopLoss,
    size: values.size,
    leverage,
    accountCurrency: account.currency,
    quoteRate,
    riskAmount: stopLoss != null ? undefined : optionalNumber(values.riskAmount),
  });

  const fallbackNow = toIsoString(now());
  const tradedAt = values.tradedAt || existing?.createdAt || fallbackNow;
  const newlyClosed = status === 'closed' && existing?.status !== 'closed';
  const closeReason =
    status === 'closed'
      ? values.closeReason ?? existing?.closeReason
      : undefined;

  return tradeSchema.parse({
    id: existing?.id ?? uid('trade'),
    accountId: account.id,
    symbol: values.symbol.toUpperCase(),
    direction: values.direction,
    entryPrice: values.entryPrice,
    exitPrice,
    stopLoss,
    takeProfit,
    market: values.market,
    size: values.size,
    leverage,
    quoteRate,
    riskAmount: metrics.riskAmount,
    rMultiple: metrics.rMultiple,
    pnl: metrics.pnl,
    setupTag: values.setupTag,
    emotionTag: values.emotionTag || undefined,
    notes: values.notes || undefined,
    screenshotDataUrl: values.screenshotDataUrl || existing?.screenshotDataUrl,
    status,
    closeReason,
    createdAt: tradedAt,
    closedAt:
      status === 'closed'
        ? newlyClosed
          ? fallbackNow
          : existing?.closedAt ?? fallbackNow
        : undefined,
  });
}

export function tradeToFormValues(trade: Trade): TradeFormValues {
  const market = tradeMarket(trade);
  return {
    market,
    symbol: trade.symbol,
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    size: trade.size,
    leverage: trade.leverage ?? MIN_LEVERAGE,
    quoteRate: trade.quoteRate,
    riskAmount: trade.riskAmount,
    setupTag: trade.setupTag,
    emotionTag: trade.emotionTag,
    notes: trade.notes,
    status: trade.status,
    closeReason: trade.closeReason,
    screenshotDataUrl: trade.screenshotDataUrl,
    tradedAt: trade.createdAt,
  };
}

export const journalRepo = {
  /** Trades of the active account, newest first. */
  async getAll(): Promise<Trade[]> {
    const account = await this.getActiveAccount();
    if (!account) return [];
    const trades = await tradesItem.getValue();
    return sortNewestFirst(trades.filter((t) => t.accountId === account.id));
  },

  async getById(id: string): Promise<Trade | undefined> {
    const trades = await tradesItem.getValue();
    return trades.find((t) => t.id === id);
  },

  async create(values: TradeFormValues): Promise<Trade> {
    const account = await this.getActiveAccount();
    if (!account) throw new Error('Create an account first');
    const trade = toTrade(
      { ...values, status: 'open', exitPrice: undefined },
      undefined,
      account,
    );
    const trades = await tradesItem.getValue();
    await tradesItem.setValue([trade, ...trades]);
    await notifyChanged();
    return trade;
  },

  async update(id: string, values: TradeFormValues): Promise<Trade> {
    const trades = await tradesItem.getValue();
    const existing = trades.find((t) => t.id === id);
    if (!existing) throw new Error('Trade not found');
    const accounts = await accountsItem.getValue();
    const account =
      accounts.find((a) => a.id === existing.accountId) ??
      (await this.getActiveAccount());
    if (!account) throw new Error('Account not found');
    const updated = toTrade(values, existing, account);
    await tradesItem.setValue(
      trades.map((t) => (t.id === id ? updated : t)),
    );
    await notifyChanged();
    return updated;
  },

  /** Close an open position at its stop-loss price. */
  async closeAtStopLoss(id: string): Promise<Trade> {
    return this.closeAtLevel(id, 'stopLoss');
  },

  /** Close an open position at its take-profit price. */
  async closeAtTakeProfit(id: string): Promise<Trade> {
    return this.closeAtLevel(id, 'takeProfit');
  },

  async closeAtLevel(
    id: string,
    level: 'stopLoss' | 'takeProfit',
  ): Promise<Trade> {
    const existing = await this.getById(id);
    if (!existing) throw new Error('Trade not found');
    if (existing.status === 'closed') {
      throw new Error('Trade is already closed');
    }
    const exitPrice = existing[level];
    if (exitPrice == null) {
      throw new Error(
        level === 'stopLoss'
          ? 'Stop loss is not set'
          : 'Take profit is not set',
      );
    }
    return this.update(id, {
      ...tradeToFormValues(existing),
      exitPrice,
      status: 'closed',
      closeReason: level,
    });
  },

  async delete(id: string): Promise<void> {
    const trades = await tradesItem.getValue();
    await tradesItem.setValue(trades.filter((t) => t.id !== id));
    await notifyChanged();
  },

  async getStats(): Promise<JournalStats> {
    const account = await this.getActiveAccount();
    return computeStats(await this.getAll(), account?.initialBalance ?? 0);
  },

  async getAccounts(): Promise<Account[]> {
    return accountsItem.getValue();
  },

  async getActiveAccount(): Promise<Account | null> {
    const [accounts, settings] = await Promise.all([
      accountsItem.getValue(),
      this.getSettings(),
    ]);
    return pickActiveAccount(accounts, settings.activeAccountId);
  },

  async setActiveAccount(id: string): Promise<void> {
    const accounts = await accountsItem.getValue();
    if (!accounts.some((a) => a.id === id)) throw new Error('Account not found');
    await this.updateSettings({ activeAccountId: id });
    await notifyChanged();
  },

  /** Current balance per account: initial balance + realized P&L of closed trades. */
  async getAccountBalances(): Promise<Record<string, number>> {
    const [accounts, trades] = await Promise.all([
      accountsItem.getValue(),
      tradesItem.getValue(),
    ]);
    const balances: Record<string, number> = {};
    for (const a of accounts) balances[a.id] = a.initialBalance;
    for (const t of trades) {
      const current = t.accountId ? balances[t.accountId] : undefined;
      if (t.status === 'closed' && current != null) {
        balances[t.accountId!] = current + (t.pnl ?? 0);
      }
    }
    return balances;
  },

  async countTrades(accountId: string): Promise<number> {
    const trades = await tradesItem.getValue();
    return trades.filter((t) => t.accountId === accountId).length;
  },

  /** New accounts become active. The first one adopts trades logged before accounts existed. */
  async createAccount(values: AccountFormValues): Promise<Account> {
    const account = accountSchema.parse({
      ...values,
      icon: values.icon || undefined,
      id: uid('acct'),
      createdAt: toIsoString(now()),
    });
    const accounts = await accountsItem.getValue();
    await accountsItem.setValue([...accounts, account]);

    if (accounts.length === 0) {
      const trades = await tradesItem.getValue();
      if (trades.some((t) => !t.accountId)) {
        await tradesItem.setValue(
          trades.map((t) => (t.accountId ? t : { ...t, accountId: account.id })),
        );
      }
    }

    await this.updateSettings({ activeAccountId: account.id });
    await notifyChanged();
    return account;
  },

  async updateAccount(id: string, values: AccountFormValues): Promise<Account> {
    const accounts = await accountsItem.getValue();
    const existing = accounts.find((a) => a.id === id);
    if (!existing) throw new Error('Account not found');
    const updated = accountSchema.parse({
      ...existing,
      ...values,
      icon: values.icon || undefined,
    });
    await accountsItem.setValue(accounts.map((a) => (a.id === id ? updated : a)));
    await notifyChanged();
    return updated;
  },

  /** Deletes the account together with all of its trades. */
  async deleteAccount(id: string): Promise<void> {
    const accounts = await accountsItem.getValue();
    const remaining = accounts.filter((a) => a.id !== id);
    const trades = await tradesItem.getValue();
    await tradesItem.setValue(trades.filter((t) => t.accountId !== id));
    await accountsItem.setValue(remaining);
    const settings = await this.getSettings();
    if (settings.activeAccountId === id || !remaining.length) {
      await this.updateSettings({ activeAccountId: remaining[0]?.id });
    }
    await notifyChanged();
  },

  async getSetups(): Promise<Setup[]> {
    return setupsItem.getValue();
  },

  async createSetup(input: Omit<Setup, 'id'>): Promise<Setup> {
    const setup = setupSchema.parse({ ...input, id: uid('setup') });
    const setups = await setupsItem.getValue();
    await setupsItem.setValue([...setups, setup]);
    return setup;
  },

  async updateSetup(id: string, input: Omit<Setup, 'id'>): Promise<Setup> {
    const setups = await setupsItem.getValue();
    const updated = setupSchema.parse({ ...input, id });
    await setupsItem.setValue(
      setups.map((s) => (s.id === id ? updated : s)),
    );
    return updated;
  },

  async deleteSetup(id: string): Promise<void> {
    const setups = await setupsItem.getValue();
    await setupsItem.setValue(setups.filter((s) => s.id !== id));
  },

  async getEmotionTags(): Promise<EmotionTag[]> {
    return emotionsItem.getValue();
  },

  async createEmotionTag(input: Omit<EmotionTag, 'id'>): Promise<EmotionTag> {
    const tag = emotionTagSchema.parse({ ...input, id: uid('emo') });
    const tags = await emotionsItem.getValue();
    await emotionsItem.setValue([...tags, tag]);
    return tag;
  },

  async updateEmotionTag(
    id: string,
    input: Omit<EmotionTag, 'id'>,
  ): Promise<EmotionTag> {
    const tags = await emotionsItem.getValue();
    const updated = emotionTagSchema.parse({ ...input, id });
    await emotionsItem.setValue(
      tags.map((t) => (t.id === id ? updated : t)),
    );
    return updated;
  },

  async deleteEmotionTag(id: string): Promise<void> {
    const tags = await emotionsItem.getValue();
    await emotionsItem.setValue(tags.filter((t) => t.id !== id));
  },

  async getSettings(): Promise<Settings> {
    return settingsSchema.parse(await settingsItem.getValue());
  },

  async updateSettings(partial: Partial<Settings>): Promise<Settings> {
    const current = await this.getSettings();
    const next = settingsSchema.parse({ ...current, ...partial });
    await settingsItem.setValue(next);
    return next;
  },

  async exportAll(): Promise<JournalExport> {
    const payload = journalExportSchema.parse({
      version: 1,
      exportedAt: toIsoString(now()),
      accounts: await accountsItem.getValue(),
      trades: await tradesItem.getValue(),
      setups: await setupsItem.getValue(),
      emotionTags: await emotionsItem.getValue(),
      settings: await this.getSettings(),
    });
    return payload;
  },

  async importAll(raw: unknown): Promise<void> {
    const data = journalExportSchema.parse(raw);
    await accountsItem.setValue(data.accounts);
    await tradesItem.setValue(data.trades);
    await setupsItem.setValue(data.setups);
    await emotionsItem.setValue(data.emotionTags);
    await settingsItem.setValue(data.settings);
    await notifyChanged();
  },

  async clearAll(): Promise<void> {
    await tradesItem.setValue([]);
    await accountsItem.setValue([]);
    await this.updateSettings({ activeAccountId: undefined });
    await setupsItem.setValue([
      { id: 'setup_breakout', name: 'Breakout', color: '#3B82F6' },
      { id: 'setup_reversal', name: 'Reversal', color: '#8B5CF6' },
      { id: 'setup_pullback', name: 'Pullback', color: '#14B8A6' },
    ]);
    await emotionsItem.setValue([
      { id: 'emo_calm', name: 'Calm', color: '#22C55E' },
      { id: 'emo_fomo', name: 'FOMO', color: '#F59E0B' },
      { id: 'emo_revenge', name: 'Revenge', color: '#EF4444' },
      { id: 'emo_confident', name: 'Confident', color: '#06B6D4' },
    ]);
    await notifyChanged();
  },

  watchTrades(cb: (trades: Trade[]) => void) {
    return tradesItem.watch(cb);
  },

  watchSettings(cb: (settings: Settings) => void) {
    return settingsItem.watch(cb);
  },

  watchAccounts(cb: (accounts: Account[]) => void) {
    return accountsItem.watch(cb);
  },
};
