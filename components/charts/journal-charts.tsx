import ReactECharts from 'echarts-for-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/hooks/use-locale';
import {
  DATE_PATTERNS,
  formatDate,
  formatDayKey,
  monthsAgoDayKey,
  now,
} from '@/lib/date';
import { APP_FONT_STACK } from '@/lib/fonts';
import { useNumberCurrency } from '@/components/ui/number-value';
import { formatNumberValue } from '@/lib/number';
import type { Locale } from '@/lib/schemas';
import type { JournalStats } from '@/lib/types';

/** The heatmap grid is Gregorian, so its month labels stay Gregorian (Persian script in fa). */
const CALENDAR_NAMES: Record<Locale, { firstDay: number; days: string[]; months: string[] }> = {
  fa: {
    firstDay: 6,
    days: ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'],
    months: [
      'ژانویه',
      'فوریه',
      'مارس',
      'آوریل',
      'مه',
      'ژوئن',
      'ژوئیه',
      'اوت',
      'سپتامبر',
      'اکتبر',
      'نوامبر',
      'دسامبر',
    ],
  },
  en: {
    firstDay: 1,
    days: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    months: [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ],
  },
};

function useIsDark() {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

/** ECharts renders to canvas, so locale-specific font and formatting must be passed explicitly. */
function useChartLocale() {
  const { locale } = useLocale();
  const [fontsVersion, setFontsVersion] = useState(0);

  useEffect(() => {
    if (typeof document === 'undefined' || !('fonts' in document)) return;
    let alive = true;
    const bump = () => {
      if (alive) setFontsVersion((v) => v + 1);
    };
    document.fonts.ready.then(bump);
    document.fonts.addEventListener('loadingdone', bump);
    return () => {
      alive = false;
      document.fonts.removeEventListener('loadingdone', bump);
    };
  }, []);

  // Recreated after web fonts finish loading so canvas text is redrawn with them.
  const textStyle = useMemo(
    () => ({ fontFamily: APP_FONT_STACK[locale] }),
    [locale, fontsVersion],
  );
  const currency = useNumberCurrency();

  return { locale, textStyle, currency };
}

function formatCurrency(value: unknown, locale: Locale, currency?: string) {
  return formatNumberValue(value, { variant: 'currency', locale, currency }).text;
}

export function EquityCurveChart({
  data,
  color = '#3B82F6',
}: {
  data: JournalStats['equityCurve'];
  color?: string;
}) {
  const { t } = useTranslation();
  const dark = useIsDark();
  const { locale, textStyle, currency } = useChartLocale();
  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle,
      grid: { left: 16, right: 16, top: 24, bottom: 28, containLabel: true },
      tooltip: {
        trigger: 'axis',
        textStyle,
        formatter: (
          params: Array<{
            axisValue: string;
            marker: string;
            seriesName: string;
            value: number;
          }>,
        ) => {
          const first = params[0];
          if (!first) return '';
          const date = formatDate(first.axisValue, DATE_PATTERNS[locale].long, locale);
          return `${date}<br/>${first.marker}${first.seriesName}: ${formatCurrency(first.value, locale, currency)}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
        axisLabel: {
          color: dark ? '#a1a1aa' : '#71717a',
          formatter: (value: string) =>
            formatDate(value, DATE_PATTERNS[locale].short, locale),
        },
      },
      yAxis: {
        type: 'value',
        // Equity is a balance, so don't force the axis down to zero.
        scale: true,
        axisLabel: {
          color: dark ? '#a1a1aa' : '#71717a',
          formatter: (value: number) =>
            formatNumberValue(value, { decimals: 0, locale }).text,
        },
        splitLine: { lineStyle: { color: dark ? '#27272a' : '#e4e4e7' } },
      },
      series: [
        {
          name: t('overview.equityCurve'),
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: { opacity: 0.12 },
          lineStyle: { width: 2, color },
          itemStyle: { color },
          data: data.map((d) => d.equity),
        },
      ],
    }),
    [data, dark, t, locale, textStyle, currency, color],
  );

  return <ReactECharts option={option} style={{ height: 280 }} />;
}

export function PnlCalendarHeatmap({ data }: { data: JournalStats['pnlByDay'] }) {
  const dark = useIsDark();
  const { locale, textStyle, currency } = useChartLocale();
  const option = useMemo(() => {
    const values = data.map((d) => [d.date, d.pnl] as [string, number]);
    const end = data.at(-1)?.date ?? formatDayKey(now());
    const start = monthsAgoDayKey(4, now());
    const names = CALENDAR_NAMES[locale];
    return {
      backgroundColor: 'transparent',
      textStyle,
      tooltip: {
        textStyle,
        formatter: (p: { data?: [string, number] }) =>
          p.data
            ? `${formatDate(p.data[0], DATE_PATTERNS[locale].long, locale)}: ${formatCurrency(p.data[1], locale, currency)}`
            : '',
      },
      visualMap: {
        min: Math.min(0, ...data.map((d) => d.pnl), -1),
        max: Math.max(0, ...data.map((d) => d.pnl), 1),
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        formatter: (value: number) => formatCurrency(value, locale, currency),
        inRange: {
          color: ['#EF4444', dark ? '#27272a' : '#f4f4f5', '#22C55E'],
        },
        textStyle: { ...textStyle, color: dark ? '#a1a1aa' : '#71717a' },
      },
      calendar: {
        top: 24,
        left: 28,
        right: 12,
        bottom: 40,
        cellSize: ['auto', 14],
        range: [start, end],
        itemStyle: { borderWidth: 2, borderColor: dark ? '#18181b' : '#fff' },
        yearLabel: { show: false },
        dayLabel: {
          color: dark ? '#a1a1aa' : '#71717a',
          firstDay: names.firstDay,
          nameMap: names.days,
        },
        monthLabel: {
          color: dark ? '#a1a1aa' : '#71717a',
          nameMap: names.months,
        },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: values,
        },
      ],
    };
  }, [data, dark, locale, textStyle, currency]);

  return <ReactECharts option={option} style={{ height: 220 }} />;
}

export function BarChart({
  categories,
  values,
  color = '#3B82F6',
}: {
  categories: string[];
  values: number[];
  color?: string;
}) {
  const dark = useIsDark();
  const { textStyle } = useChartLocale();
  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      textStyle,
      grid: { left: 48, right: 16, top: 24, bottom: 40 },
      tooltip: { trigger: 'axis', textStyle },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: dark ? '#a1a1aa' : '#71717a', rotate: 20 },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: dark ? '#a1a1aa' : '#71717a' },
        splitLine: { lineStyle: { color: dark ? '#27272a' : '#e4e4e7' } },
      },
      series: [
        {
          type: 'bar',
          data: values,
          itemStyle: { color, borderRadius: [4, 4, 0, 0] },
        },
      ],
    }),
    [categories, values, color, dark, textStyle],
  );
  return <ReactECharts option={option} style={{ height: 280 }} />;
}

export function HistogramChart({
  categories,
  values,
}: {
  categories: string[];
  values: number[];
}) {
  return <BarChart categories={categories} values={values} color="#8B5CF6" />;
}
