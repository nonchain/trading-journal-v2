import type { Direction, Market } from './schemas';

export const MARKETS = ['forex', 'crypto'] as const;

export const LOT_STEP = 0.001;
export const MIN_LOT = 0.001;
export const MIN_LEVERAGE = 1;

export const MAX_LEVERAGE: Record<Market, number> = {
  forex: 2000,
  crypto: 200,
};

export const DEFAULT_LEVERAGE: Record<Market, number> = {
  forex: 100,
  crypto: 10,
};

export const DEFAULT_LOT = 0.01;

/** Isolated-margin maintenance rate used for the liquidation estimate (first exchange tier). */
export const CRYPTO_MAINTENANCE_MARGIN_RATE = 0.004;

export const STANDARD_FOREX_LOT = 100_000;

const FOREX_CONTRACT_SIZES: Record<string, number> = {
  XAU: 100,
  XAG: 5_000,
  XPT: 100,
  XPD: 100,
};

const FOREX_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'NZD',
  'SEK', 'NOK', 'DKK', 'SGD', 'HKD', 'CNH', 'ZAR', 'MXN',
  'TRY', 'PLN', 'HUF', 'CZK', 'ILS', 'THB',
  'XAU', 'XAG', 'XPT', 'XPD',
]);

const USD_LIKE = new Set(['USD', 'USDT', 'USDC', 'FDUSD', 'BUSD', 'TUSD', 'DAI']);

/** Longest suffixes first so `USDT` wins over `USD`. */
const CRYPTO_QUOTES = [
  'FDUSD', 'USDT', 'USDC', 'BUSD', 'TUSD', 'DAI',
  'USD', 'EUR', 'TRY', 'BTC', 'ETH', 'BNB',
];

const CRYPTO_BASES = new Set([
  'BTC', 'ETH', 'SOL', 'XRP', 'BNB', 'DOGE', 'ADA', 'TRX', 'TON', 'AVAX',
  'DOT', 'LINK', 'LTC', 'BCH', 'MATIC', 'POL', 'SHIB', 'PEPE', 'ARB', 'OP',
  'SUI', 'APT', 'NEAR', 'ATOM', 'UNI', 'ETC', 'FIL', 'INJ', 'WIF', 'XLM',
]);

export interface ParsedSymbol {
  base: string;
  quote: string;
}

/** `BINANCE:BTCUSDT.P` → `BTCUSDT`, `OANDA:EUR/USD` → `EURUSD`. */
export function normalizeSymbol(symbol: string): string {
  const withoutExchange = symbol.includes(':')
    ? symbol.slice(symbol.lastIndexOf(':') + 1)
    : symbol;
  return withoutExchange
    .toUpperCase()
    .replace(/\.P$/, '')
    .replace(/PERP$/, '')
    .replace(/[^A-Z0-9]/g, '');
}

export function parseSymbol(
  symbol: string,
  market: Market,
): ParsedSymbol | undefined {
  const s = normalizeSymbol(symbol);
  if (market === 'forex') {
    if (s.length !== 6) return undefined;
    const base = s.slice(0, 3);
    const quote = s.slice(3);
    if (!FOREX_CURRENCIES.has(base) || !FOREX_CURRENCIES.has(quote)) {
      return undefined;
    }
    return { base, quote };
  }
  const quote = CRYPTO_QUOTES.find((q) => s.length > q.length && s.endsWith(q));
  if (!quote) return undefined;
  return { base: s.slice(0, -quote.length), quote };
}

export function detectMarket(symbol: string | undefined): Market | undefined {
  if (!symbol) return undefined;
  const raw = symbol.toUpperCase();
  if (/\.P$|PERP$/.test(raw)) return 'crypto';
  const crypto = parseSymbol(symbol, 'crypto');
  if (crypto && (CRYPTO_BASES.has(crypto.base) || crypto.quote !== 'USD')) {
    if (!parseSymbol(symbol, 'forex')) return 'crypto';
  }
  if (parseSymbol(symbol, 'forex')) return 'forex';
  if (crypto) return 'crypto';
  return undefined;
}

/** Units of the base asset controlled by one lot. */
export function contractSize(symbol: string, market: Market | undefined): number {
  if (market !== 'forex') return 1;
  const parsed = parseSymbol(symbol, 'forex');
  return (parsed && FOREX_CONTRACT_SIZES[parsed.base]) ?? STANDARD_FOREX_LOT;
}

export function pipSize(symbol: string): number {
  const parsed = parseSymbol(symbol, 'forex');
  if (parsed?.base === 'XAU') return 0.1;
  if (parsed?.base === 'XAG') return 0.01;
  if (parsed?.quote === 'JPY') return 0.01;
  return 0.0001;
}

/** USD stablecoins are treated as USD for conversion purposes. */
export function sameCurrency(a: string, b: string): boolean {
  const norm = (c: string) => (USD_LIKE.has(c.toUpperCase()) ? 'USD' : c.toUpperCase());
  return norm(a) === norm(b);
}

/**
 * True when P&L is denominated in a quote currency that differs from the account
 * currency and can't be derived from the trade's own prices (e.g. EURGBP on a USD account).
 */
export function needsQuoteRate(
  symbol: string,
  market: Market | undefined,
  accountCurrency = 'USD',
): boolean {
  if (!market) return false;
  const parsed = parseSymbol(symbol, market);
  if (!parsed) return false;
  if (sameCurrency(parsed.quote, accountCurrency)) return false;
  if (market === 'forex' && sameCurrency(parsed.base, accountCurrency)) return false;
  return true;
}

/** Converts an amount in quote currency at `price` into the account currency. */
function quoteToAccountFactor(
  symbol: string,
  market: Market | undefined,
  price: number,
  accountCurrency: string,
  quoteRate: number | undefined,
): number {
  if (!market) return 1;
  const parsed = parseSymbol(symbol, market);
  if (!parsed || sameCurrency(parsed.quote, accountCurrency)) return 1;
  if (market === 'forex' && sameCurrency(parsed.base, accountCurrency)) return 1 / price;
  return quoteRate != null && quoteRate > 0 ? quoteRate : 1;
}

export interface PositionInput {
  market?: Market;
  symbol: string;
  direction: Direction;
  entryPrice: number;
  exitPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  /** Lots — multiplied by the contract size to get base units. */
  size: number;
  leverage?: number;
  /** Currency all money amounts are expressed in. Defaults to USD. */
  accountCurrency?: string;
  /** Quote currency → account currency rate, when it can't be derived. */
  quoteRate?: number;
  /** Only used when there's no stop loss to derive risk from. */
  riskAmount?: number;
}

export interface PositionMetrics {
  contractSize: number;
  units: number;
  notional: number;
  margin?: number;
  pipSize?: number;
  pipValue?: number;
  liquidationPrice?: number;
  pnl?: number;
  riskAmount?: number;
  rewardAmount?: number;
  rMultiple?: number;
  roe?: number;
}

function finite(value: number | undefined): number | undefined {
  return value != null && Number.isFinite(value) ? value : undefined;
}

export function computePosition(input: PositionInput): PositionMetrics {
  const { market, symbol, direction, entryPrice, exitPrice, stopLoss, takeProfit, size, quoteRate } = input;
  const leverage =
    input.leverage != null && input.leverage >= MIN_LEVERAGE ? input.leverage : undefined;
  const cs = contractSize(symbol, market);
  const units = size * cs;
  const accountCurrency = input.accountCurrency ?? 'USD';
  const toAccount = (amount: number, price: number) =>
    amount * quoteToAccountFactor(symbol, market, price, accountCurrency, quoteRate);
  const move = (to: number) => (direction === 'long' ? to - entryPrice : entryPrice - to);

  const notional = toAccount(units * entryPrice, entryPrice);
  const margin = leverage ? notional / leverage : undefined;

  const pnl = exitPrice != null ? toAccount(move(exitPrice) * units, exitPrice) : undefined;
  const riskAmount =
    stopLoss != null
      ? toAccount(Math.abs(entryPrice - stopLoss) * units, stopLoss)
      : input.riskAmount;
  const rewardAmount =
    takeProfit != null
      ? toAccount(Math.abs(takeProfit - entryPrice) * units, takeProfit)
      : undefined;

  let pip: number | undefined;
  let pipValue: number | undefined;
  if (market === 'forex') {
    pip = pipSize(symbol);
    pipValue = toAccount(pip * units, entryPrice);
  }

  let liquidationPrice: number | undefined;
  if (market === 'crypto' && leverage) {
    const mmr = CRYPTO_MAINTENANCE_MARGIN_RATE;
    const price =
      direction === 'long'
        ? entryPrice * (1 - 1 / leverage + mmr)
        : entryPrice * (1 + 1 / leverage - mmr);
    liquidationPrice = price > 0 ? price : undefined;
  }

  return {
    contractSize: cs,
    units,
    notional,
    margin: finite(margin),
    pipSize: pip,
    pipValue: finite(pipValue),
    liquidationPrice: finite(liquidationPrice),
    pnl: finite(pnl),
    riskAmount: finite(riskAmount),
    rewardAmount: finite(rewardAmount),
    rMultiple:
      pnl != null && riskAmount != null && riskAmount > 0
        ? finite(pnl / riskAmount)
        : undefined,
    roe: pnl != null && margin ? finite((pnl / margin) * 100) : undefined,
  };
}

/** Legacy trades stored size as raw units, which matches crypto's contract size of 1. */
export function tradeMarket(trade: { market?: Market }): Market {
  return trade.market ?? 'crypto';
}

export function isLotStep(value: number): boolean {
  const steps = value / LOT_STEP;
  return Math.abs(steps - Math.round(steps)) < 1e-6;
}
