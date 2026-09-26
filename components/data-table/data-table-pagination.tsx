import type { Table } from '@tanstack/react-table';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
}

export function DataTablePagination<TData>({
  table,
}: DataTablePaginationProps<TData>) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center justify-end gap-2 py-2">
      <span className="text-sm text-muted-foreground">
        {t('common.page')} {table.getState().pagination.pageIndex + 1}{' '}
        {t('common.of')} {table.getPageCount() || 1}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {t('common.previous')}
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {t('common.next')}
      </Button>
    </div>
  );
}
