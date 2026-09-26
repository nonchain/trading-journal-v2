import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart,
  HistogramChart,
} from '@/components/charts/journal-charts';
import { EmptyState } from '@/components/shared/empty-state';
import type { JournalStats } from '@/lib/types';

export function StatisticsPage({
  stats,
  loading,
}: {
  stats: JournalStats | null;
  loading: boolean;
}) {
  const { t } = useTranslation();

  if (loading || !stats) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-80" />
        ))}
      </div>
    );
  }

  if (stats.closedTrades < 1) {
    return (
      <EmptyState
        title={t('stats.emptyTitle')}
        description={t('stats.emptyDescription')}
      />
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('stats.winRateBySetup')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            categories={stats.winRateBySetup.map((d) => d.name)}
            values={stats.winRateBySetup.map((d) => d.winRate)}
            color="#14B8A6"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('stats.pnlBySymbol')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            categories={stats.pnlBySymbol.map((d) => d.symbol)}
            values={stats.pnlBySymbol.map((d) => d.pnl)}
            color="#3B82F6"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('stats.winRateBySession')}</CardTitle>
        </CardHeader>
        <CardContent>
          <BarChart
            categories={stats.winRateBySession.map((d) => d.session)}
            values={stats.winRateBySession.map((d) => d.winRate)}
            color="#F59E0B"
          />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{t('stats.rDistribution')}</CardTitle>
        </CardHeader>
        <CardContent>
          <HistogramChart
            categories={stats.rDistribution.map((d) => d.bucket)}
            values={stats.rDistribution.map((d) => d.count)}
          />
        </CardContent>
      </Card>
    </div>
  );
}
