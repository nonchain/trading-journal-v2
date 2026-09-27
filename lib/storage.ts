import { storage } from 'wxt/utils/storage';
import { now, toIsoString, toUnix } from './date';
import {
  emotionTagSchema,
  journalExportSchema,
  settingsSchema,
  setupSchema,
  tradeSchema,
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

async function notifyChanged() {
  try {
    await browser.runtime.sendMessage({ type: 'TRADES_CHANGED' });
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
  existing?: Trade,
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
  const quoteRate = needsQuoteRate(values.symbol, values.market)
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
  async getAll(): Promise<Trade[]> {
    const trades = await tradesItem.getValue();
    return [...trades].sort(
      (a, b) => toUnix(b.createdAt) - toUnix(a.createdAt),
    );
  },

  async getById(id: string): Promise<Trade | undefined> {
    const trades = await tradesItem.getValue();
    return trades.find((t) => t.id === id);
  },

  async create(values: TradeFormValues): Promise<Trade> {
    const trade = toTrade({
      ...values,
      status: 'open',
      exitPrice: undefined,
    });
    const trades = await tradesItem.getValue();
    await tradesItem.setValue([trade, ...trades]);
    await notifyChanged();
    return trade;
  },

  async update(id: string, values: TradeFormValues): Promise<Trade> {
    const trades = await tradesItem.getValue();
    const existing = trades.find((t) => t.id === id);
    if (!existing) throw new Error('Trade not found');
    const updated = toTrade(values, existing);
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
    return computeStats(await this.getAll());
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
      trades: await tradesItem.getValue(),
      setups: await setupsItem.getValue(),
      emotionTags: await emotionsItem.getValue(),
      settings: await this.getSettings(),
    });
    return payload;
  },

  async importAll(raw: unknown): Promise<void> {
    const data = journalExportSchema.parse(raw);
    await tradesItem.setValue(data.trades);
    await setupsItem.setValue(data.setups);
    await emotionsItem.setValue(data.emotionTags);
    await settingsItem.setValue(data.settings);
    await notifyChanged();
  },

  async clearAll(): Promise<void> {
    await tradesItem.setValue([]);
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
};
