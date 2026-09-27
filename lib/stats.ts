import {
  endOfDay,
  endOfWeek,
  formatDayKey,
  getHour,
  isWithinRange,
  parseDate,
  startOfDay,
  startOfWeek,
  toUnix,
} from './date';
import type { JournalStats, Trade, TradeFilter } from './types';

function isWin(trade: Trade) {
  if (trade.pnl != null) return trade.pnl > 0;
  if (trade.rMultiple != null) return trade.rMultiple > 0;
  return false;
}

function tradeTimestamp(trade: Trade) {
  return parseDate(trade.closedAt ?? trade.createdAt);
}

export function filterTrades(trades: Trade[], filter: TradeFilter): Trade[] {
  switch (filter.kind) {
    case 'today': {
      const start = startOfDay();
      const end = endOfDay();
      return trades.filter((t) =>
        isWithinRange(tradeTimestamp(t), start, end),
      );
    }
    case 'week': {
      const start = startOfWeek();
      const end = endOfWeek();
      return trades.filter((t) =>
        isWithinRange(tradeTimestamp(t), start, end),
      );
    }
    case 'setup':
      return trades.filter((t) => t.setupTag === filter.setupTag);
    default:
      return trades;
  }
}

function sessionLabel(date: ReturnType<typeof parseDate>) {
  const hour = getHour(date);
  if (hour >= 0 && hour < 8) return 'Asia';
  if (hour >= 8 && hour < 13) return 'London';
  if (hour >= 13 && hour < 21) return 'New York';
  return 'Overnight';
}

function rBucket(r: number) {
  if (r < -2) return '< -2R';
  if (r < -1) return '-2R to -1R';
  if (r < 0) return '-1R to 0R';
  if (r < 1) return '0R to 1R';
  if (r < 2) return '1R to 2R';
  if (r < 3) return '2R to 3R';
  return '≥ 3R';
}

export function computeStats(trades: Trade[]): JournalStats {
  const closed = trades
    .filter((t) => t.status === 'closed')
    .sort(
      (a, b) => toUnix(tradeTimestamp(a)) - toUnix(tradeTimestamp(b)),
    );

  const wins = closed.filter(isWin);
  const winRate = closed.length ? (wins.length / closed.length) * 100 : 0;
  const totalPnl = closed.reduce((sum, t) => sum + (t.pnl ?? 0), 0);

  const withR = closed.filter((t) => t.rMultiple != null);
  const avgR = withR.length
    ? withR.reduce((sum, t) => sum + (t.rMultiple ?? 0), 0) / withR.length
    : 0;

  let currentStreak = 0;
  let streakType: JournalStats['streakType'] = 'none';
  if (closed.length) {
    const newestFirst = [...closed].reverse();
    const first = newestFirst[0];
    if (first) {
      const firstWin = isWin(first);
      streakType = firstWin ? 'win' : 'loss';
      for (const trade of newestFirst) {
        if (isWin(trade) === firstWin) currentStreak += 1;
        else break;
      }
    }
  }

  let running = 0;
  const equityCurve = closed.map((t) => {
    running += t.pnl ?? 0;
    return {
      date: formatDayKey(tradeTimestamp(t)),
      equity: running,
    };
  });

  const pnlByDayMap = new Map<string, number>();
  for (const t of closed) {
    const key = formatDayKey(tradeTimestamp(t));
    pnlByDayMap.set(key, (pnlByDayMap.get(key) ?? 0) + (t.pnl ?? 0));
  }
  const pnlByDay = [...pnlByDayMap.entries()]
    .map(([date, pnl]) => ({ date, pnl }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const setupMap = new Map<string, { wins: number; count: number }>();
  for (const t of closed) {
    const cur = setupMap.get(t.setupTag) ?? { wins: 0, count: 0 };
    cur.count += 1;
    if (isWin(t)) cur.wins += 1;
    setupMap.set(t.setupTag, cur);
  }
  const winRateBySetup = [...setupMap.entries()].map(([name, v]) => ({
    name,
    count: v.count,
    winRate: v.count ? (v.wins / v.count) * 100 : 0,
  }));

  const symbolMap = new Map<string, { pnl: number; count: number }>();
  for (const t of closed) {
    const cur = symbolMap.get(t.symbol) ?? { pnl: 0, count: 0 };
    cur.count += 1;
    cur.pnl += t.pnl ?? 0;
    symbolMap.set(t.symbol, cur);
  }
  const pnlBySymbol = [...symbolMap.entries()]
    .map(([symbol, v]) => ({ symbol, ...v }))
    .sort((a, b) => b.pnl - a.pnl);

  const sessionMap = new Map<string, { wins: number; count: number }>();
  for (const t of closed) {
    const label = sessionLabel(tradeTimestamp(t));
    const cur = sessionMap.get(label) ?? { wins: 0, count: 0 };
    cur.count += 1;
    if (isWin(t)) cur.wins += 1;
    sessionMap.set(label, cur);
  }
  const winRateBySession = [...sessionMap.entries()].map(([session, v]) => ({
    session,
    count: v.count,
    winRate: v.count ? (v.wins / v.count) * 100 : 0,
  }));

  const bucketOrder = [
    '< -2R',
    '-2R to -1R',
    '-1R to 0R',
    '0R to 1R',
    '1R to 2R',
    '2R to 3R',
    '≥ 3R',
  ];
  const rMap = new Map(bucketOrder.map((b) => [b, 0]));
  for (const t of withR) {
    const b = rBucket(t.rMultiple!);
    rMap.set(b, (rMap.get(b) ?? 0) + 1);
  }
  const rDistribution = bucketOrder.map((bucket) => ({
    bucket,
    count: rMap.get(bucket) ?? 0,
  }));

  return {
    totalTrades: trades.length,
    closedTrades: closed.length,
    winRate,
    totalPnl,
    avgR,
    currentStreak,
    streakType,
    equityCurve,
    pnlByDay,
    winRateBySetup,
    pnlBySymbol,
    winRateBySession,
    rDistribution,
  };
}
