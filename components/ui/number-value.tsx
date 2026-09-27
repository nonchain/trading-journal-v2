import { createContext, useContext, type ReactNode } from 'react';
import {
  formatNumberValue,
  NUMBER_VALUE_FALLBACK,
  type FormatNumberValueOptions,
  type NumberValueVariant,
} from '@/lib/number';
import { cn } from '@/lib/utils';

export type { NumberValueVariant };

const CurrencyContext = createContext<string | undefined>(undefined);

/** Default currency for every `NumberValue variant="currency"` below it. */
export function NumberCurrencyProvider({
  currency,
  children,
}: {
  currency: string | undefined;
  children: ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={currency}>{children}</CurrencyContext.Provider>
  );
}

export function useNumberCurrency(): string | undefined {
  return useContext(CurrencyContext);
}

type NumberValueProps = FormatNumberValueOptions & {
  value: unknown;
  /** Shown when value cannot be formatted. Default `—`. */
  fallback?: string;
  /** Appended after a successful format (e.g. `R`, `%`). */
  suffix?: string;
  /** Color text green/red from the numeric sign. */
  signed?: boolean;
  className?: string;
  title?: string;
};

/**
 * Reusable display for numeric / currency values with 3-digit grouping.
 *
 * @example
 * <NumberValue value={1234.5} />
 * <NumberValue value={pnl} variant="currency" signed />
 * <NumberValue value={price} decimals={5} />
 */
export function NumberValue({
  value,
  variant = 'number',
  decimals = 2,
  currency,
  locale,
  fallback = NUMBER_VALUE_FALLBACK,
  suffix,
  signed = false,
  className,
  title,
}: NumberValueProps) {
  const contextCurrency = useNumberCurrency();
  const result = formatNumberValue(value, {
    variant,
    decimals,
    currency: currency ?? contextCurrency,
    locale,
  });

  if (!result.ok) {
    return (
      <span
        className={cn('tabular-nums text-muted-foreground', className)}
        title={title ?? result.error}
        data-invalid="true"
      >
        {fallback}
      </span>
    );
  }

  const text = suffix ? `${result.text}${suffix}` : result.text;

  return (
    <span
      className={cn(
        'tabular-nums',
        signed &&
          (result.numeric > 0
            ? 'text-profit'
            : result.numeric < 0
              ? 'text-loss'
              : undefined),
        className,
      )}
      title={title}
    >
      {text}
    </span>
  );
}
