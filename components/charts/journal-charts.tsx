import ReactECharts from 'echarts-for-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { formatDayKey, monthsAgoDayKey, now } from '@/lib/date';
import type { JournalStats } from '@/lib/types';

function useIsDark() {
  if (typeof document === 'undefined') return true;
  return document.documentElement.classList.contains('dark');
}

export function EquityCurveChart({ data }: { data: JournalStats['equityCurve'] }) {
  const { t } = useTranslation();
  const dark = useIsDark();
  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: { left: 40, right: 16, top: 24, bottom: 28 },
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: data.map((d) => d.date),
        axisLabel: { color: dark ? '#a1a1aa' : '#71717a' },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: dark ? '#a1a1aa' : '#71717a' },
        splitLine: { lineStyle: { color: dark ? '#27272a' : '#e4e4e7' } },
      },
      series: [
        {
          name: t('overview.equityCurve'),
          type: 'line',
          smooth: true,
          showSymbol: false,
          areaStyle: { opacity: 0.12 },
          lineStyle: { width: 2, color: '#3B82F6' },
          itemStyle: { color: '#3B82F6' },
          data: data.map((d) => d.equity),
        },
      ],
    }),
    [data, dark, t],
  );

  return <ReactECharts option={option} style={{ height: 280 }} />;
}

export function PnlCalendarHeatmap({ data }: { data: JournalStats['pnlByDay'] }) {
  const dark = useIsDark();
  const option = useMemo(() => {
    const values = data.map((d) => [d.date, d.pnl] as [string, number]);
    const end = data.at(-1)?.date ?? formatDayKey(now());
    const start = monthsAgoDayKey(4, now());
    return {
      backgroundColor: 'transparent',
      tooltip: {
        formatter: (p: { data?: [string, number] }) =>
          p.data ? `${p.data[0]}: ${p.data[1].toFixed(2)}` : '',
      },
      visualMap: {
        min: Math.min(0, ...data.map((d) => d.pnl), -1),
        max: Math.max(0, ...data.map((d) => d.pnl), 1),
        calculable: false,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        inRange: {
          color: ['#EF4444', dark ? '#27272a' : '#f4f4f5', '#22C55E'],
        },
        textStyle: { color: dark ? '#a1a1aa' : '#71717a' },
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
        dayLabel: { color: dark ? '#a1a1aa' : '#71717a' },
        monthLabel: { color: dark ? '#a1a1aa' : '#71717a' },
      },
      series: [
        {
          type: 'heatmap',
          coordinateSystem: 'calendar',
          data: values,
        },
      ],
    };
  }, [data, dark]);

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
  const option = useMemo(
    () => ({
      backgroundColor: 'transparent',
      grid: { left: 48, right: 16, top: 24, bottom: 40 },
      tooltip: { trigger: 'axis' },
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
    [categories, values, color, dark],
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
