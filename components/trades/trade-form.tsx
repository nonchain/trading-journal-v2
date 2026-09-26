import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AppDatePicker } from '@/components/ui/date-picker';
import { Icon } from '@/components/ui/icon';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { now, toIsoString } from '@/lib/date';
import { tradeFormSchema, type TradeFormValues } from '@/lib/schemas';
import type { EmotionTag, Setup, Trade } from '@/lib/types';

const emptyDefaults: TradeFormValues = {
  symbol: '',
  direction: 'long',
  entryPrice: 0,
  exitPrice: undefined,
  stopLoss: undefined,
  takeProfit: undefined,
  size: 1,
  riskAmount: undefined,
  setupTag: '',
  emotionTag: '',
  notes: '',
  status: 'open',
  screenshotDataUrl: undefined,
  tradedAt: toIsoString(now()),
};

function tradeToForm(trade: Trade): TradeFormValues {
  return {
    symbol: trade.symbol,
    direction: trade.direction,
    entryPrice: trade.entryPrice,
    exitPrice: trade.exitPrice,
    stopLoss: trade.stopLoss,
    takeProfit: trade.takeProfit,
    size: trade.size,
    riskAmount: trade.riskAmount,
    setupTag: trade.setupTag,
    emotionTag: trade.emotionTag ?? '',
    notes: trade.notes ?? '',
    status: trade.status,
    closeReason: trade.closeReason,
    screenshotDataUrl: trade.screenshotDataUrl,
    tradedAt: trade.createdAt,
  };
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
  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeFormSchema) as never,
    defaultValues: initial
      ? tradeToForm(initial)
      : {
          ...emptyDefaults,
          symbol: defaultSymbol ?? '',
          setupTag: setups[0]?.name ?? '',
        },
  });

  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        className={compact ? 'space-y-3' : 'space-y-4'}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({
            ...values,
            emotionTag: values.emotionTag || undefined,
          });
        })}
      >
        <div className={compact ? 'grid grid-cols-2 gap-2' : 'grid grid-cols-2 gap-3'}>
          <FormField
            control={form.control}
            name="symbol"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.symbol')}</FormLabel>
                <FormControl>
                  <Input {...field} autoComplete="off" />
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
          <FormField
            control={form.control}
            name="entryPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.entry')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 0 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="stopLoss"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.stop')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? undefined : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="takeProfit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.target')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === ''
                          ? undefined
                          : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="size"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('trades.fields.size')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    value={field.value ?? ''}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value === '' ? 1 : Number(e.target.value),
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
