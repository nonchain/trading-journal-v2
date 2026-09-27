import { zodResolver } from '@hookform/resolvers/zod';
import type { ReactNode } from 'react';
import { useForm, useWatch, type Control } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AppDatePicker } from '@/components/ui/date-picker';
import { Icon } from '@/components/ui/icon';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberValue } from '@/components/ui/number-value';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useLocale } from '@/hooks/use-locale';
import { now, toIsoString } from '@/lib/date';
import {
  computePosition,
  contractSize,
  DEFAULT_LEVERAGE,
  DEFAULT_LOT,
  detectMarket,
  LOT_STEP,
  MAX_LEVERAGE,
  MIN_LEVERAGE,
  MIN_LOT,
  needsQuoteRate,
  parseSymbol,
} from '@/lib/markets';
import { formatNumberValue } from '@/lib/number';
import {
  tradeFormSchema,
  type Market,
  type TradeFormValues,
} from '@/lib/schemas';
import { tradeToFormValues } from '@/lib/storage';
import { cn } from '@/lib/utils';
import type { EmotionTag, Setup, Trade } from '@/lib/types';

const MARKET_ICONS: Record<Market, string> = {
  forex: 'exchange-dollar-line',
  crypto: 'bit-coin-line',
};

const SYMBOL_PLACEHOLDERS: Record<Market, string> = {
  forex: 'EURUSD',
  crypto: 'BTCUSDT',
};

function emptyDefaults(market: Market): TradeFormValues {
  return {
    market,
    symbol: '',
    direction: 'long',
    entryPrice: undefined as unknown as number,
    exitPrice: undefined,
    stopLoss: undefined,
    takeProfit: undefined,
    size: DEFAULT_LOT,
    leverage: DEFAULT_LEVERAGE[market],
    quoteRate: undefined,
    riskAmount: undefined,
    setupTag: '',
    emotionTag: '',
    notes: '',
    status: 'open',
    screenshotDataUrl: undefined,
    tradedAt: toIsoString(now()),
  };
}

function tradeToForm(trade: Trade): TradeFormValues {
  return {
    ...tradeToFormValues(trade),
    emotionTag: trade.emotionTag ?? '',
    notes: trade.notes ?? '',
  };
}

function toOptionalNumber(value: string) {
  return value === '' ? undefined : Number(value);
}

function priceDecimals(price: number) {
  if (price >= 100) return 2;
  if (price >= 1) return 4;
  return 6;
}

interface TradeFormProps {
  setups: Setup[];
  emotions: EmotionTag[];
  initial?: Trade;
  defaultSymbol?: string;
  compact?: boolean;
  onSubmit: (values: TradeFormValues) => Promise<void> | void;
  onCancel?: () => void;
  onCaptureScreenshot?: () => Promise<string | undefined>;
}

export function TradeForm({
  setups,
  emotions,
  initial,
  defaultSymbol,
  compact,
  onSubmit,
  onCancel,
  onCaptureScreenshot,
}: TradeFormProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema) as never,
    defaultValues: initial
      ? tradeToForm(initial)
      : {
          ...emptyDefaults(detectMarket(defaultSymbol) ?? 'forex'),
          symbol: defaultSymbol ?? '',
          setupTag: setups[0]?.name ?? '',
        },
  });

  const submitting = form.formState.isSubmitting;
  const market = useWatch({ control: form.control, name: 'market' });

  const changeMarket = (next: Market) => {
    const prev = form.getValues('market');
    if (next === prev) return;
    form.setValue('market', next, { shouldDirty: true });
    const leverage = form.getValues('leverage');
    if (leverage === DEFAULT_LEVERAGE[prev] || leverage > MAX_LEVERAGE[next]) {
      form.setValue('leverage', DEFAULT_LEVERAGE[next], { shouldDirty: true });
    }
    form.clearErrors(['leverage', 'quoteRate', 'size']);
  };

  const gridCols = compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3';

  return (
    <Form {...form}>
      <form
        className={compact ? 'space-y-3' : 'space-y-4'}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            ...values,
            quoteRate: needsQuoteRate(values.symbol, values.market)
              ? values.quoteRate
              : undefined,
            emotionTag: values.emotionTag || undefined,
          });
        })}
      >
        <Tabs
          value={market}
          onValueChange={(v) => changeMarket(v as Market)}
          dir={locale === 'fa' ? 'rtl' : 'ltr'}
          className={compact ? 'space-y-3' : 'space-y-4'}
        >
          <TabsList className="grid w-full grid-cols-2">
            {(['forex', 'crypto'] as const).map((m) => (
              <TabsTrigger key={m} value={m} className="gap-1.5">
                <Icon name={MARKET_ICONS[m]} />
                {t(`trades.market.${m}`)}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className={gridCols}>
            <FormField
              control={form.control}
              name="symbol"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('trades.fields.symbol')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      autoComplete="off"
                      placeholder={SYMBOL_PLACEHOLDERS[market]}
                      onBlur={() => {
                        field.onBlur();
                        const detected = detectMarket(field.value);
                        if (detected) changeMarket(detected);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="direction"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('trades.fields.direction')}</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="long">{t('common.long')}</SelectItem>
                      <SelectItem value="short">{t('common.short')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="tradedAt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.date')}</FormLabel>
                <FormControl>
                  <AppDatePicker
                    value={field.value}
                    onChange={field.onChange}
                    withTime
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-3 gap-3'}>
            {(['entryPrice', 'stopLoss', 'takeProfit'] as const).map((name) => (
              <FormField
                key={name}
                control={form.control}
                name={name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t(
                        name === 'entryPrice'
                          ? 'trades.fields.entry'
                          : name === 'stopLoss'
                            ? 'trades.fields.stop'
                            : 'trades.fields.target',
                      )}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        min={0}
                        inputMode="decimal"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(toOptionalNumber(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>

          {(['forex', 'crypto'] as const).map((m) => (
            <TabsContent key={m} value={m} className="mt-0">
              <PositionSizingFields
                market={m}
                control={form.control}
                compact={compact}
              />
            </TabsContent>
          ))}
        </Tabs>

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="setupTag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.setup')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {setups.map((s) => (
                      <SelectItem key={s.id} value={s.name}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="emotionTag"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.emotion')}</FormLabel>
                <Select
                  value={field.value || '__none__'}
                  onValueChange={(v) =>
                    field.onChange(v === '__none__' ? '' : v)
                  }
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('common.optional')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="__none__">{t('common.optional')}</SelectItem>
                    {emotions.map((e) => (
                      <SelectItem key={e.id} value={e.name}>
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {!compact && (
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.notes')}</FormLabel>
                <FormControl>
                  <Textarea rows={3} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {onCaptureScreenshot && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={submitting}
            onClick={async () => {
              const dataUrl = await onCaptureScreenshot();
              if (dataUrl) form.setValue('screenshotDataUrl', dataUrl);
            }}
          >
            <Icon name="camera-line" />
            {t('trades.fields.captureScreenshot')}
          </Button>
        )}

        {form.watch('screenshotDataUrl') && (
          <img
            src={form.watch('screenshotDataUrl')}
            alt=""
            className="max-h-32 w-full rounded-md border object-cover"
          />
        )}

        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {t('common.save')}
          </Button>
        </div>
      </form>
    </Form>
  );
}

function PositionSizingFields({
  market,
  control,
  compact,
}: {
  market: Market;
  control: Control<TradeFormValues>;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const symbol = useWatch({ control, name: 'symbol' }) ?? '';
  const parsed = parseSymbol(symbol, market);
  const base = parsed?.base ?? t('trades.hints.baseFallback');
  const units = formatNumberValue(contractSize(symbol, market), {
    decimals: 0,
    locale,
  }).text;
  const showQuoteRate = needsQuoteRate(symbol, market);
  const maxLeverage = formatNumberValue(MAX_LEVERAGE[market], {
    decimals: 0,
    locale,
  }).text;

  return (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3'}>
        <FormField
          control={control}
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('trades.fields.lotSize')}</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step={LOT_STEP}
                  min={MIN_LOT}
                  inputMode="decimal"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(toOptionalNumber(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                {market === 'forex'
                  ? t('trades.hints.forexLot', { units, base })
                  : t('trades.hints.cryptoLot', { base })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name="leverage"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('trades.fields.leverage')}</FormLabel>
              <FormControl>
                <div className="relative" dir="ltr">
                  <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">
                    {market === 'forex' ? '1:' : '×'}
                  </span>
                  <Input
                    type="number"
                    step={1}
                    min={MIN_LEVERAGE}
                    max={MAX_LEVERAGE[market]}
                    inputMode="numeric"
                    className="pl-8"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(toOptionalNumber(e.target.value))
                    }
                  />
                </div>
              </FormControl>
              <FormDescription>
                {t('trades.hints.leverageRange', { max: maxLeverage })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      {showQuoteRate && parsed && (
        <FormField
          control={control}
          name="quoteRate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('trades.fields.quoteRate', { quote: parsed.quote })}
              </FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="any"
                  min={0}
                  inputMode="decimal"
                  value={field.value ?? ''}
                  onChange={(e) =>
                    field.onChange(toOptionalNumber(e.target.value))
                  }
                />
              </FormControl>
              <FormDescription>
                {t('trades.hints.quoteRate', { quote: parsed.quote })}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <PositionSummary market={market} control={control} />
    </div>
  );
}

function PositionSummary({
  market,
  control,
}: {
  market: Market;
  control: Control<TradeFormValues>;
}) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [symbol, direction, entryPrice, stopLoss, takeProfit, size, leverage, quoteRate] =
    useWatch({
      control,
      name: [
        'symbol',
        'direction',
        'entryPrice',
        'stopLoss',
        'takeProfit',
        'size',
        'leverage',
        'quoteRate',
      ],
    });

  if (!(entryPrice > 0) || !(size > 0)) return null;

  const p = computePosition({
    market,
    symbol: symbol ?? '',
    direction,
    entryPrice,
    stopLoss,
    takeProfit,
    size,
    leverage,
    quoteRate,
  });
  const base = parseSymbol(symbol ?? '', market)?.base;
  const money = (value: number | undefined, key: string) => (
    <NumberValue key={key} value={value} variant="currency" locale={locale} />
  );

  const items: Array<[string, ReactNode]> = [];
  if (market === 'forex') {
    items.push([
      t('trades.summary.units'),
      <NumberValue
        key="units"
        value={p.units}
        decimals={p.units >= 1 ? 0 : 3}
        locale={locale}
        suffix={base ? ` ${base}` : undefined}
      />,
    ]);
    if (p.pipValue != null) {
      items.push([t('trades.summary.pipValue'), money(p.pipValue, 'pip')]);
    }
  }
  items.push([t('trades.summary.positionValue'), money(p.notional, 'notional')]);
  if (p.margin != null) {
    items.push([t('trades.summary.margin'), money(p.margin, 'margin')]);
  }
  if (p.liquidationPrice != null) {
    items.push([
      t('trades.summary.liquidation'),
      <NumberValue
        key="liq"
        value={p.liquidationPrice}
        decimals={priceDecimals(entryPrice)}
        locale={locale}
      />,
    ]);
  }
  if (p.riskAmount != null) {
    items.push([
      t('trades.summary.risk'),
      <NumberValue
        key="risk"
        value={-p.riskAmount}
        variant="currency"
        locale={locale}
        className="text-loss"
      />,
    ]);
  }
  if (p.rewardAmount != null) {
    items.push([
      t('trades.summary.reward'),
      <NumberValue
        key="reward"
        value={p.rewardAmount}
        variant="currency"
        locale={locale}
        signed
        className="text-profit"
      />,
    ]);
  }
  if (p.riskAmount && p.rewardAmount != null) {
    items.push([
      t('trades.summary.riskReward'),
      <span key="rr" dir="ltr">
        1 :{' '}
        <NumberValue value={p.rewardAmount / p.riskAmount} locale={locale} />
      </span>,
    ]);
  }

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-md border bg-muted/40 p-3 text-xs',
      )}
    >
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-2">
          <dt className="text-muted-foreground">{label}</dt>
          <dd className="font-medium tabular-nums">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
