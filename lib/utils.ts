import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatNumberValue } from '@/lib/number';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Prefer `<NumberValue variant="currency" />` in UI. */
export function formatCurrency(value: number, currency = 'USD') {
  return formatNumberValue(value, { variant: 'currency', currency }).text;
}

/** Prefer `<NumberValue />` in UI. */
export function formatNumber(value: number, digits = 2) {
  return formatNumberValue(value, { variant: 'number', decimals: digits }).text;
}

export function uid(prefix = 'id') {
  return `${prefix}_${crypto.randomUUID()}`;
}
