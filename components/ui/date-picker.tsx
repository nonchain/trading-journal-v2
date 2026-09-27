import { useMemo } from 'react';
import DatePickerModule from 'react-multi-date-picker';
import TimePickerModule from 'react-multi-date-picker/plugins/time_picker';
import type { DatePickerProps, Value } from 'react-multi-date-picker';
import { useLocale } from '@/hooks/use-locale';
import {
  DATE_PATTERNS,
  getCalendarConfig,
  isDateObject,
  toDateObject,
  toIsoString,
  type DateObjectInstance,
} from '@/lib/date';
import { cn } from '@/lib/utils';
import 'react-multi-date-picker/styles/colors/teal.css';

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

const DatePicker = resolveExport(DatePickerModule) as typeof DatePickerModule;
const TimePicker = resolveExport(TimePickerModule) as typeof TimePickerModule;

type Props = {
  value?: string | null;
  onChange: (iso: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  withTime?: boolean;
  className?: string;
  id?: string;
} & Omit<
  DatePickerProps,
  'value' | 'onChange' | 'calendar' | 'locale' | 'plugins' | 'render'
>;

function dateFromPicker(
  date: DateObjectInstance | DateObjectInstance[] | null,
): string | undefined {
  if (!date || Array.isArray(date)) return undefined;
  if (!isDateObject(date)) return undefined;
  // Invalid / empty selection
  if (date.isValid === false) return undefined;
  try {
    return toIsoString(date);
  } catch {
    return undefined;
  }
}

export function AppDatePicker({
  value,
  onChange,
  placeholder,
  disabled,
  withTime = false,
  className,
  id,
  ...rest
}: Props) {
  const { locale: appLocale } = useLocale();
  const { calendar, locale } = useMemo(
    () => getCalendarConfig(appLocale),
    [appLocale],
  );

  const pickerValue = useMemo(() => {
    if (!value) return undefined;
    try {
      return toDateObject(value, appLocale);
    } catch {
      return undefined;
    }
  }, [value, appLocale]);

  return (
    <DatePicker
      id={id}
      value={(pickerValue ?? '') as Value}
      onChange={(date) => {
        const iso = dateFromPicker(
          date as DateObjectInstance | DateObjectInstance[] | null,
        );
        onChange(iso);
      }}
      calendar={calendar}
      locale={locale}
      format={
        withTime
          ? `${DATE_PATTERNS[appLocale].date} HH:mm`
          : DATE_PATTERNS[appLocale].date
      }
      disabled={disabled}
      // Do NOT use portal inside Radix Dialog — body gets pointer-events:none
      // and calendar clicks never reach the picker (onChange never fires).
      portal={false}
      zIndex={10000}
      editable={false}
      plugins={
        withTime
          ? [<TimePicker key="time" position="bottom" hideSeconds />]
          : []
      }
      containerClassName={cn('w-full', className)}
      inputClass={cn(
        'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      )}
      placeholder={placeholder}
      calendarPosition="bottom-center"
      {...rest}
    />
  );
}
