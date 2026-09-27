import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { NumberValue } from '@/components/ui/number-value';
import { useLocale } from '@/hooks/use-locale';
import { formatDateTime } from '@/lib/date';
import { cn } from '@/lib/utils';
import type { Trade } from '@/lib/types';

interface TradeCardProps {
  trade: Trade;
  onClick?: () => void;
  compact?: boolean;
}

export function TradeCard({ trade, onClick, compact }: TradeCardProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg border bg-card text-start transition-colors hover:bg-accent/40',
        compact ? 'p-2.5' : 'p-3',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold tracking-tight">{trade.symbol}</span>
            <Badge variant={trade.direction === 'long' ? 'profit' : 'loss'}>
              {t(`common.${trade.direction}`)}
            </Badge>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {trade.setupTag}
            {' · '}
            {formatDateTime(trade.createdAt, locale)}
          </p>
        </div>
        <div className="text-end">
          {trade.pnl != null ? (
            <NumberValue
              value={trade.pnl}
              variant="currency"
              locale={locale}
              signed
              className="font-medium"
            />
          ) : (
            <Badge variant="secondary">{t(`common.${trade.status}`)}</Badge>
          )}
          {trade.rMultiple != null && (
            <NumberValue
              value={trade.rMultiple}
              locale={locale}
              suffix="R"
              className="block text-xs text-muted-foreground"
            />
          )}
        </div>
      </div>
    </button>
  );
}
