import type { ColumnDef } from '@tanstack/react-table';
import type { TFunction } from 'i18next';
import { Badge } from '@/components/ui/badge';
import { NumberValue } from '@/components/ui/number-value';
import { DataTableColumnHeader } from '@/components/data-table/data-table-column-header';
import {
  createActionsColumn,
  type CreateActionsColumnOptions,
  type DataTableCustomAction,
} from '@/components/data-table/data-table-row-actions';
import { formatDate } from '@/lib/date';
import type { Locale } from '@/lib/schemas';
import type { Trade } from '@/lib/types';

export type { DataTableCustomAction };

export type GetTradeColumnsOptions = {
  t: TFunction;
  locale: Locale;
} & CreateActionsColumnOptions<Trade>;

export function getTradeColumns({
  t,
  locale,
  editable = false,
  deletable = false,
  menu = false,
  onEdit,
  onDelete,
  actions,
}: GetTradeColumnsOptions): ColumnDef<Trade>[] {
  const columns: ColumnDef<Trade>[] = [
    {
      accessorKey: 'createdAt',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('trades.columns.date')} />
      ),
      cell: ({ row }) =>
        formatDate(
          row.original.createdAt,
          locale === 'fa' ? 'YYYY/MM/DD' : 'YYYY-MM-DD',
          locale,
        ),
    },
    {
      accessorKey: 'symbol',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trades.columns.symbol')}
        />
      ),
      cell: ({ row }) => (
        <span className="font-medium">{row.original.symbol}</span>
      ),
    },
    {
      accessorKey: 'setupTag',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trades.columns.setup')}
        />
      ),
    },
    {
      accessorKey: 'direction',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trades.columns.direction')}
        />
      ),
      cell: ({ row }) => (
        <Badge variant={row.original.direction === 'long' ? 'profit' : 'loss'}>
          {t(`common.${row.original.direction}`)}
        </Badge>
      ),
    },
    {
      accessorKey: 'rMultiple',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trades.columns.rMultiple')}
        />
      ),
      cell: ({ row }) => (
        <NumberValue
          value={row.original.rMultiple}
          locale={locale}
          suffix="R"
        />
      ),
    },
    {
      accessorKey: 'pnl',
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={t('trades.columns.pnl')} />
      ),
      cell: ({ row }) => (
        <NumberValue
          value={row.original.pnl}
          variant="currency"
          locale={locale}
          decimals={4}
          signed
          className="font-medium"
        />
      ),
    },
    {
      accessorKey: 'emotionTag',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trades.columns.emotion')}
        />
      ),
      cell: ({ row }) => row.original.emotionTag ?? '—',
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <DataTableColumnHeader
          column={column}
          title={t('trades.columns.status')}
        />
      ),
      cell: ({ row }) => (
        <Badge variant="secondary">{t(`common.${row.original.status}`)}</Badge>
      ),
    },
  ];

  if (editable || deletable || actions) {
    columns.push(
      createActionsColumn<Trade>({
        editable,
        deletable,
        menu,
        onEdit,
        onDelete,
        actions,
      }),
    );
  }

  return columns;
}
