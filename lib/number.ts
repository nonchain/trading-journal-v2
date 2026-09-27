export type NumberValueVariant = 'number' | 'currency';

export type FormatNumberValueOptions = {
  /** `number` (default) or `currency` */
  variant?: NumberValueVariant;
  /**
   * Fraction digits. Default `2`.
   * Clamped to `0`–`20` (Intl limit).
   */
  decimals?: number;
  /** ISO 4217 code when `variant="currency"`. Defaults to `USD`. */
  currency?: string;
  /** BCP 47 locale (e.g. `en`, `fa`). Defaults to runtime locale. */
  locale?: string;
};

export type FormatNumberValueResult =
  | { ok: true; text: string; numeric: number }
  | { ok: false; text: string; error: string };

export const NUMBER_VALUE_FALLBACK = '—';
const DEFAULT_DECIMALS = 2;
const DEFAULT_CURRENCY = 'USD';

function clampDecimals(decimals: number | undefined): number {
  const raw = decimals ?? DEFAULT_DECIMALS;
  if (!Number.isFinite(raw)) return DEFAULT_DECIMALS;
  return Math.min(20, Math.max(0, Math.trunc(raw)));
}

function normalizeCurrency(currency: string | undefined): string {
  const code = (currency ?? DEFAULT_CURRENCY).trim().toUpperCase();
  // 4–5 letter codes (USDT, USDC) aren't ISO; Intl rejects them and they fall back to a code prefix.
  if (!/^[A-Z]{3,5}$/.test(code)) return DEFAULT_CURRENCY;
  return code;
}

/**
 * Coerce unknown input into a finite number.
 * Accepts numbers and numeric strings (including grouped forms like "1,234.5").
 */
export function parseNumberValue(
  value: unknown,
): { ok: true; value: number } | { ok: false; error: string } {
  if (value == null || value === '') {
    return { ok: false, error: 'empty' };
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { ok: false, error: 'not_finite' };
    }
    return { ok: true, value };
  }

  if (typeof value === 'bigint') {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return { ok: false, error: 'not_finite' };
    }
    return { ok: true, value: numeric };
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return { ok: false, error: 'empty' };

    // Strip common grouping / currency noise, keep digits, sign, decimal, exponent.
    const cleaned = trimmed
      .replace(/[\s\u00A0]/g, '')
      .replace(/[^0-9eE+.\-]/g, '');

    if (!cleaned || cleaned === '-' || cleaned === '+' || cleaned === '.') {
      return { ok: false, error: 'invalid_string' };
    }

    const numeric = Number(cleaned);
    if (!Number.isFinite(numeric)) {
      return { ok: false, error: 'invalid_string' };
    }
    return { ok: true, value: numeric };
  }

  return { ok: false, error: 'unsupported_type' };
}

/**
 * Format a value with thousand separators (3-digit grouping) and fixed decimals.
 * Safe against null, NaN, Infinity, bad currency codes, and bad decimal counts.
 */
export function formatNumberValue(
  value: unknown,
  options: FormatNumberValueOptions = {},
): FormatNumberValueResult {
  const parsed = parseNumberValue(value);
  if (!parsed.ok) {
    return { ok: false, text: NUMBER_VALUE_FALLBACK, error: parsed.error };
  }

  const decimals = clampDecimals(options.decimals);
  const variant = options.variant ?? 'number';
  const locale = options.locale;

  try {
    if (variant === 'currency') {
      const currency = normalizeCurrency(options.currency);
      try {
        const text = new Intl.NumberFormat(locale, {
          style: 'currency',
          currency,
          useGrouping: true,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(parsed.value);
        return { ok: true, text, numeric: parsed.value };
      } catch {
        // Invalid currency for this runtime — fall back to plain number with code prefix.
        const text = new Intl.NumberFormat(locale, {
          style: 'decimal',
          useGrouping: true,
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(parsed.value);
        return {
          ok: true,
          text: `${currency} ${text}`,
          numeric: parsed.value,
        };
      }
    }

    const text = new Intl.NumberFormat(locale, {
      style: 'decimal',
      useGrouping: true,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(parsed.value);

    return { ok: true, text, numeric: parsed.value };
  } catch (err) {
    return {
      ok: false,
      text: NUMBER_VALUE_FALLBACK,
      error: err instanceof Error ? err.message : 'format_failed',
    };
  }
}
