import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NumberValue } from '@/components/ui/number-value';
import { Skeleton } from '@/components/ui/skeleton';
import {
  EquityCurveChart,
  PnlCalendarHeatmap,
} from '@/components/charts/journal-charts';
import { EmptyState } from '@/components/shared/empty-state';
import type { Locale } from '@/lib/schemas';
import type { JournalStats } from '@/lib/types';

export function OverviewPage({
  stats,
  loading,
  onNewTrade,
}: {
  stats: JournalStats | null;
  loading: boolean;
  onNewTrade: () => void;
}) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'fa' ? 'fa' : 'en') as Locale;

  if (loading || !stats) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-72" />
      </div>
    );
  }

  if (stats.closedTrades === 0) {
    return (
      <EmptyState
        title={t('overview.emptyTitle')}
        description={t('overview.emptyDescription')}
        actionLabel={t('trades.newTrade')}
        onAction={onNewTrade}
      />
    );
  }

  const streakLabel =
    stats.streakType === 'none'
      ? t('kpi.none')
      : stats.streakType === 'win'
        ? t('kpi.wins', { count: stats.currentStreak })
        : t('kpi.losses', { count: stats.currentStreak });

  const kpis: Array<{ label: string; value: ReactNode }> = [
    {
      label: t('kpi.winRate'),
      value: (
        <NumberValue value={stats.winRate} decimals={1} locale={locale} suffix="%" />
      ),
    },
    {
      label: t('kpi.totalPnl'),
      value: (
        <NumberValue
          value={stats.totalPnl}
          variant="currency"
          locale={locale}
          signed
        />
      ),
    },
    {
      label: t('kpi.avgR'),
      value: <NumberValue value={stats.avgR} locale={locale} suffix="R" />,
    },
    { label: t('kpi.streak'), value: streakLabel },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-semibold tracking-tight">
                {kpi.value}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('overview.equityCurve')}</CardTitle>
          </CardHeader>
          <CardContent>
            <EquityCurveChart data={stats.equityCurve} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('overview.pnlCalendar')}</CardTitle>
          </CardHeader>
          <CardContent>
            <PnlCalendarHeatmap data={stats.pnlByDay} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
