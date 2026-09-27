import { z } from 'zod';
import {
  isLotStep,
  MAX_LEVERAGE,
  MIN_LEVERAGE,
  MIN_LOT,
  needsQuoteRate,
} from './markets';

export const marketSchema = z.enum(['forex', 'crypto']);
export const directionSchema = z.enum(['long', 'short']);
export const tradeStatusSchema = z.enum(['planned', 'open', 'closed']);
export const closeReasonSchema = z.enum(['stopLoss', 'takeProfit']);
export const themeSchema = z.enum(['light', 'dark', 'system']);
export const localeSchema = z.enum(['en', 'fa']);

export const tradeSchema = z.object({
  id: z.string().min(1),
  symbol: z.string().trim().min(1).max(32),
  direction: directionSchema,
  entryPrice: z.number().finite().positive(),
  exitPrice: z.number().finite().positive().optional(),
  stopLoss: z.number().finite().positive().optional(),
  takeProfit: z.number().finite().positive().optional(),
  /** Missing on trades logged before markets existed — those use raw units. */
  market: marketSchema.optional(),
  /** Lots for forex (× contract size), base-asset quantity for crypto. */
  size: z.number().finite().positive(),
  leverage: z.number().finite().min(MIN_LEVERAGE).optional(),
  /** Quote currency → USD rate for pairs like EURGBP. */
  quoteRate: z.number().finite().positive().optional(),
  riskAmount: z.number().finite().nonnegative().optional(),
  rMultiple: z.number().finite().optional(),
  pnl: z.number().finite().optional(),
  setupTag: z.string().min(1),
  emotionTag: z.string().optional(),
  notes: z.string().max(4000).optional(),
  screenshotDataUrl: z.string().optional(),
  status: tradeStatusSchema,
  /** Why the trade was closed — keeps exit in sync when SL/TP is corrected later. */
  closeReason: closeReasonSchema.optional(),
  createdAt: z.string().datetime(),
  closedAt: z.string().datetime().optional(),
});

const optionalPositive = z.number().finite().positive().optional();

/** Messages are i18n keys, translated by `FormMessage`. */
export const tradeFormSchema = z
  .object({
    market: marketSchema,
    symbol: z.string().trim().min(1, 'validation.symbolRequired').max(32),
    direction: directionSchema,
    entryPrice: z
      .number('validation.numberRequired')
      .finite()
      .positive('validation.entryPositive'),
    exitPrice: optionalPositive,
    stopLoss: optionalPositive,
    takeProfit: optionalPositive,
    size: z
      .number('validation.numberRequired')
      .finite()
      .min(MIN_LOT, 'validation.minLot')
      .refine(isLotStep, 'validation.lotStep'),
    leverage: z
      .number('validation.numberRequired')
      .int('validation.leverageInteger')
      .min(MIN_LEVERAGE, 'validation.minLeverage'),
    quoteRate: optionalPositive,
    riskAmount: z.number().finite().nonnegative().optional(),
    setupTag: z.string().min(1, 'validation.setupRequired'),
    emotionTag: z.string().optional(),
    notes: z.string().max(4000).optional(),
    status: tradeStatusSchema,
    closeReason: closeReasonSchema.optional(),
    screenshotDataUrl: z.string().optional(),
    /** Trade datetime (ISO). Defaults to now on create. */
    tradedAt: z.string().datetime().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.leverage > MAX_LEVERAGE[values.market]) {
      ctx.addIssue({
        code: 'custom',
        path: ['leverage'],
        message: `validation.maxLeverage.${values.market}`,
      });
    }
    if (needsQuoteRate(values.symbol, values.market) && values.quoteRate == null) {
      ctx.addIssue({
        code: 'custom',
        path: ['quoteRate'],
        message: 'validation.quoteRateRequired',
      });
    }
  });

export const setupSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(48),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const emotionTagSchema = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1).max(48),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, 'validation.nameRequired').max(48),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'validation.invalidColor'),
});

export const settingsSchema = z.object({
  locale: localeSchema.default('fa'),
  theme: themeSchema.default('dark'),
  currency: z.string().default('USD'),
});

export const journalExportSchema = z.object({
  version: z.literal(1),
  exportedAt: z.string().datetime(),
  trades: z.array(tradeSchema),
  setups: z.array(setupSchema),
  emotionTags: z.array(emotionTagSchema),
  settings: settingsSchema,
});

export type Trade = z.infer<typeof tradeSchema>;
export type TradeFormValues = z.infer<typeof tradeFormSchema>;
export type Setup = z.infer<typeof setupSchema>;
export type EmotionTag = z.infer<typeof emotionTagSchema>;
export type TagFormValues = z.infer<typeof tagFormSchema>;
export type Settings = z.infer<typeof settingsSchema>;
export type JournalExport = z.infer<typeof journalExportSchema>;
export type Direction = z.infer<typeof directionSchema>;
export type Market = z.infer<typeof marketSchema>;
export type TradeStatus = z.infer<typeof tradeStatusSchema>;
export type CloseReason = z.infer<typeof closeReasonSchema>;
export type ThemeMode = z.infer<typeof themeSchema>;
export type Locale = z.infer<typeof localeSchema>;
