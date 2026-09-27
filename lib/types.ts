export type {
  Account,
  AccountFormValues,
  Trade,
  TradeFormValues,
  Setup,
  EmotionTag,
  TagFormValues,
  Settings,
  JournalExport,
  Direction,
  TradeStatus,
  ThemeMode,
  Locale,
} from './schemas';

export interface JournalStats {
  totalTrades: number;
  closedTrades: number;
  winRate: number;
  totalPnl: number;
  initialBalance: number;
  /** Initial balance + realized P&L. */
  balance: number;
  returnPct: number;
  avgR: number;
  currentStreak: number;
  streakType: 'win' | 'loss' | 'none';
  equityCurve: Array<{ date: string; equity: number }>;
  pnlByDay: Array<{ date: string; pnl: number }>;
  winRateBySetup: Array<{ name: string; winRate: number; count: number }>;
  pnlBySymbol: Array<{ symbol: string; pnl: number; count: number }>;
  winRateBySession: Array<{ session: string; winRate: number; count: number }>;
  rDistribution: Array<{ bucket: string; count: number }>;
}

export type TradeFilter =
  | { kind: 'all' }
  | { kind: 'today' }
  | { kind: 'week' }
  | { kind: 'setup'; setupTag: string };

export type MessageType =
  | { type: 'TRADES_CHANGED' }
  | { type: 'CAPTURE_SCREENSHOT'; tabId?: number }
  | { type: 'CAPTURE_SCREENSHOT_RESULT'; dataUrl?: string; error?: string }
  | { type: 'OPEN_OPTIONS' }
  | { type: 'OPEN_SIDEPANEL' }
  | { type: 'GET_BADGE_COUNT' };
