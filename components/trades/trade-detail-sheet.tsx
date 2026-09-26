import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { NumberValue } from '@/components/ui/number-value';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { formatDateTime } from '@/lib/date';
import type { Locale } from '@/lib/schemas';
import type { Trade } from '@/lib/types';

interface TradeDetailSheetProps {
  trade: Trade | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TradeDetailSheet({
  trade,
  open,
  onOpenChange,
}: TradeDetailSheetProps) {
  const { t, i18n } = useTranslation();
  const locale = (i18n.language === 'fa' ? 'fa' : 'en') as Locale;
  if (!trade) return null;

  const rows: Array<[string, ReactNode]> = [
    [t('trades.fields.symbol'), trade.symbol],
    [t('trades.fields.direction'), t(`common.${trade.direction}`)],
    [
      t('trades.fields.entry'),
      <NumberValue key="entry" value={trade.entryPrice} decimals={5} locale={locale} />,
    ],
    [
      t('trades.fields.exit'),
      <NumberValue key="exit" value={trade.exitPrice} decimals={5} locale={locale} />,
    ],
    [
      t('trades.fields.stop'),
      <NumberValue key="stop" value={trade.stopLoss} decimals={5} locale={locale} />,
    ],
    [
      t('trades.fields.target'),
      <NumberValue
        key="target"
        value={trade.takeProfit}
        decimals={5}
        locale={locale}
      />,
    ],
    [
      t('trades.fields.size'),
      <NumberValue key="size" value={trade.size} locale={locale} />,
    ],
    [
      t('trades.columns.rMultiple'),
      <NumberValue
        key="r"
        value={trade.rMultiple}
        locale={locale}
        suffix="R"
      />,
    ],
    [
      t('trades.columns.pnl'),
      <NumberValue
        key="pnl"
        value={trade.pnl}
        variant="currency"
        locale={locale}
        signed
      />,
    ],
    [t('trades.fields.setup'), trade.setupTag],
    [t('trades.fields.emotion'), trade.emotionTag ?? '—'],
    [t('trades.fields.status'), t(`common.${trade.status}`)],
    [t('trades.columns.date'), formatDateTime(trade.createdAt, locale)],
    [
      t('trades.fields.closedAt'),
      trade.closedAt ? formatDateTime(trade.closedAt, locale) : '—',
    ],
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{t('trades.detail')}</SheetTitle>
          <SheetDescription>
            {trade.symbol} · {trade.setupTag}
          </SheetDescription>
        </SheetHeader>

        <Separator className="my-4" />

        <dl className="space-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
        </dl>

        {trade.notes && (
          <>
            <Separator className="my-4" />
            <div>
              <p className="mb-1 text-sm text-muted-foreground">
                {t('trades.fields.notes')}
              </p>
              <p className="whitespace-pre-wrap text-sm">{trade.notes}</p>
            </div>
          </>
        )}

        <Separator className="my-4" />
        <div>
          <p className="mb-2 text-sm text-muted-foreground">
            {t('trades.screenshot')}
          </p>
          {trade.screenshotDataUrl ? (
            <img
              src={trade.screenshotDataUrl}
              alt=""
              className="w-full rounded-md border object-cover"
            />
          ) : (
            <Badge variant="secondary">{t('trades.noScreenshot')}</Badge>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
