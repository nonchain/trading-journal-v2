import DateObjectModule from 'react-date-object';
import gregorianModule from 'react-date-object/calendars/gregorian';
import persianModule from 'react-date-object/calendars/persian';
import gregorianEnModule from 'react-date-object/locales/gregorian_en';
import persianFaModule from 'react-date-object/locales/persian_fa';
import type { Calendar, Locale as DateLocale } from 'react-date-object';
import type { Locale as AppLocale } from './schemas';

/** Resolve CJS `module.exports` / `{ default: X }` under Vite ESM. */
function resolveExport<T>(mod: unknown): T {
  if (mod == null) return mod as T;
  if (typeof mod === 'function') return mod as T;
  if (typeof mod === 'object' && '$$typeof' in (mod as object)) {
    return mod as T;
  }
  if (
    typeof mod === 'object' &&
    'default' in (mod as object) &&
    (mod as { default: unknown }).default != null
  ) {
    return resolveExport<T>((mod as { default: unknown }).default);
  }
  return mod as T;
}

type DateObjectCtor = typeof DateObjectModule;
export type DateObjectInstance = InstanceType<DateObjectCtor>;

export const DateObject = resolveExport<DateObjectCtor>(DateObjectModule);

const gregorian = resolveExport<Calendar>(gregorianModule);
const persian = resolveExport<Calendar>(persianModule);
const gregorian_en = resolveExport<DateLocale>(gregorianEnModule);
const persian_fa = resolveExport<DateLocale>(persianFaModule);

/** Duck-type check — `instanceof` fails across duplicate CJS module copies. */
export function isDateObject(value: unknown): value is DateObjectInstance {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as DateObjectInstance).toDate === 'function' &&
    typeof (value as DateObjectInstance).format === 'function' &&
    typeof (value as DateObjectInstance).toUnix === 'function'
  );
}

export function getCalendarConfig(locale: AppLocale = 'en') {
  if (locale === 'fa') {
    return { calendar: persian, locale: persian_fa };
  }
  return { calendar: gregorian, locale: gregorian_en };
}

export function toDateObject(
  value?: string | number | Date | DateObjectInstance | null,
  locale: AppLocale = 'en',
): DateObjectInstance {
  const { calendar, locale: calLocale } = getCalendarConfig(locale);
  if (value == null || value === '') {
    return new DateObject({ calendar, locale: calLocale });
  }
  if (isDateObject(value)) {
    return new DateObject({
      date: value.toDate(),
      calendar,
      locale: calLocale,
    });
  }
  return new DateObject({
    date: value,
    calendar,
    locale: calLocale,
  });
}

/** Parse an ISO / storage timestamp into a DateObject (display calendar optional). */
export function parseDate(
  value: string | number | Date | DateObjectInstance,
  locale: AppLocale = 'en',
): DateObjectInstance {
  return toDateObject(value, locale);
}

export function now(locale: AppLocale = 'en'): DateObjectInstance {
  return toDateObject(undefined, locale);
}

export function toIsoString(
  value: DateObjectInstance | Date | string | number,
): string {
  if (isDateObject(value)) {
    const jsDate = value.toDate();
    if (Number.isNaN(jsDate.getTime())) {
      throw new Error('Invalid DateObject');
    }
    return jsDate.toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  const d = new DateObject({ date: value, calendar: gregorian });
  return d.toDate().toISOString();
}

export function formatDate(
  value: string | number | Date | DateObjectInstance,
  pattern = 'YYYY-MM-DD',
  locale: AppLocale = 'en',
): string {
  return parseDate(value, locale).format(pattern);
}

export function formatDateTime(
  value: string | number | Date | DateObjectInstance,
  locale: AppLocale = 'en',
): string {
  return formatDate(
    value,
    locale === 'fa' ? 'YYYY/MM/DD HH:mm' : 'MMM D, YYYY HH:mm',
    locale,
  );
}

export function formatDayKey(
  value: string | number | Date | DateObjectInstance,
): string {
  if (isDateObject(value)) {
    return new DateObject({
      date: value.toDate(),
      calendar: gregorian,
    }).format('YYYY-MM-DD');
  }
  return new DateObject({
    date: value,
    calendar: gregorian,
  }).format('YYYY-MM-DD');
}

export function startOfDay(
  value?: DateObjectInstance | Date | string,
): DateObjectInstance {
  const raw = isDateObject(value)
    ? value.toDate()
    : value
      ? new Date(value as string | Date)
      : new Date();
  return new DateObject({ date: raw, calendar: gregorian })
    .setHour(0)
    .setMinute(0)
    .setSecond(0)
    .setMillisecond(0);
}

export function endOfDay(
  value?: DateObjectInstance | Date | string,
): DateObjectInstance {
  const raw = isDateObject(value)
    ? value.toDate()
    : value
      ? new Date(value as string | Date)
      : new Date();
  return new DateObject({ date: raw, calendar: gregorian })
    .setHour(23)
    .setMinute(59)
    .setSecond(59)
    .setMillisecond(999);
}

/** Monday-based week start (trading week). */
export function startOfWeek(
  value?: DateObjectInstance | Date | string,
): DateObjectInstance {
  const d = startOfDay(value);
  const mondayOffset = (d.weekDay.index - 1 + 7) % 7;
  return d.subtract(mondayOffset, 'day');
}

export function endOfWeek(
  value?: DateObjectInstance | Date | string,
): DateObjectInstance {
  return endOfDay(startOfWeek(value).add(6, 'day'));
}

export function isWithinRange(
  value: DateObjectInstance | Date | string,
  start: DateObjectInstance,
  end: DateObjectInstance,
): boolean {
  const t = toUnix(value);
  return t >= start.toUnix() && t <= end.toUnix();
}

export function toUnix(
  value: DateObjectInstance | Date | string | number,
): number {
  if (isDateObject(value)) return value.toUnix();
  if (value instanceof Date) return Math.floor(value.getTime() / 1000);
  return new DateObject({ date: value, calendar: gregorian }).toUnix();
}

export function getHour(value: DateObjectInstance | Date | string): number {
  if (isDateObject(value)) return value.hour;
  return new DateObject({
    date: value instanceof Date ? value : value,
    calendar: gregorian,
  }).hour;
}

export function monthsAgoDayKey(
  months: number,
  from?: DateObjectInstance,
): string {
  const base = from
    ? new DateObject({ date: from.toDate(), calendar: gregorian })
    : new DateObject({ calendar: gregorian });
  return base.subtract(months, 'month').format('YYYY-MM-DD');
}
