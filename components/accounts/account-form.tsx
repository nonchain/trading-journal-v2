import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { AccountAvatar } from '@/components/accounts/account-avatar';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { NumberValue } from '@/components/ui/number-value';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale } from '@/hooks/use-locale';
import {
  ACCOUNT_COLORS,
  ACCOUNT_CURRENCIES,
  ACCOUNT_ICONS,
  currencyName,
} from '@/lib/accounts';
import { accountFormSchema, type AccountFormValues } from '@/lib/schemas';
import { cn } from '@/lib/utils';

interface AccountFormProps {
  defaultValues: AccountFormValues;
  submitLabel: string;
  /** Existing accounts: warn that changing currency doesn't convert past P&L. */
  editing?: boolean;
  compact?: boolean;
  onSubmit: (values: AccountFormValues) => Promise<void> | void;
  onCancel?: () => void;
}

export function AccountForm({
  defaultValues,
  submitLabel,
  editing,
  compact,
  onSubmit,
  onCancel,
}: AccountFormProps) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema) as never,
    defaultValues,
  });
  const [name, color, icon, currency, initialBalance] = useWatch({
    control: form.control,
    name: ['name', 'color', 'icon', 'currency', 'initialBalance'],
  });
  const submitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form
        className={compact ? 'space-y-3' : 'space-y-4'}
        onSubmit={form.handleSubmit(async (values) => {
          await onSubmit({ ...values, icon: values.icon || undefined });
        })}
      >
        <div className="flex items-center gap-3 rounded-lg border bg-muted/40 p-3">
          <AccountAvatar
            account={{ name: name || '?', color, icon }}
            size="lg"
          />
          <div className="min-w-0">
            <p className="truncate font-semibold">
              {name || t('accounts.fields.namePlaceholder')}
            </p>
            <p className="text-sm text-muted-foreground">
              <NumberValue
                value={initialBalance}
                variant="currency"
                currency={currency}
                locale={locale}
                fallback={currency}
              />
            </p>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounts.fields.name')}</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  autoComplete="off"
                  autoFocus
                  placeholder={t('accounts.fields.namePlaceholder')}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="initialBalance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('accounts.fields.initialBalance')}</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="any"
                    min={0}
                    inputMode="decimal"
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
            name="currency"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('accounts.fields.currency')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ACCOUNT_CURRENCIES.map((code) => (
                      <SelectItem key={code} value={code}>
                        <span className="font-medium">{code}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          · {currencyName(code, locale)}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {editing && (
                  <FormDescription>{t('accounts.hints.currencyChange')}</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="color"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('accounts.fields.color')}</FormLabel>
              <div role="radiogroup" className="flex flex-wrap gap-2">
                {ACCOUNT_COLORS.map((c) => {
                  const selected = field.value === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      aria-label={c}
                      onClick={() => field.onChange(c)}
                      className={cn(
                        'flex size-7 items-center justify-center rounded-full text-white ring-offset-2 ring-offset-background transition',
                        selected ? 'ring-2 ring-ring' : 'hover:scale-110',
                      )}
                      style={{ backgroundColor: c }}
                    >
                      {selected && <Icon name="check-line" className="text-sm" />}
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="icon"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {t('accounts.fields.icon')}{' '}
                <span className="font-normal text-muted-foreground">
                  ({t('common.optional')})
                </span>
              </FormLabel>
              <div
                role="radiogroup"
                className={cn(
                  'grid gap-1.5',
                  compact ? 'grid-cols-6' : 'grid-cols-9',
                )}
              >
                {[undefined, ...ACCOUNT_ICONS].map((iconName) => {
                  const selected = (field.value || undefined) === iconName;
                  return (
                    <button
                      key={iconName ?? 'none'}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      title={iconName ?? t('accounts.fields.iconNone')}
                      onClick={() => field.onChange(iconName)}
                      className={cn(
                        'flex aspect-square items-center justify-center rounded-md border text-base transition-colors',
                        selected
                          ? 'border-transparent text-white'
                          : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                      )}
                      style={selected ? { backgroundColor: color } : undefined}
                    >
                      {iconName ? (
                        <Icon name={iconName} />
                      ) : (
                        <span className="text-xs font-semibold">
                          {(name?.trim() || 'A').charAt(0).toUpperCase()}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end gap-2 pt-1">
          {onCancel && (
            <Button type="button" variant="ghost" onClick={onCancel}>
              {t('common.cancel')}
            </Button>
          )}
          <Button type="submit" disabled={submitting}>
            {submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
