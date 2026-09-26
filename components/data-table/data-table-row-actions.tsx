import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icon } from '@/components/ui/icon';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export type DataTableCustomAction<TData> = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: (row: TData) => void;
  variant?: 'default' | 'destructive';
  separatorBefore?: boolean;
};

export type DataTableRowActionsProps<TData> = {
  row: TData;
  /** Show built-in Edit item */
  editable?: boolean;
  /** Show built-in Delete item */
  deletable?: boolean;
  /**
   * `true` — actions in a 3-dot dropdown menu.
   * `false` — actions shown inline in the row.
   */
  menu?: boolean;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  /** Extra custom actions (kept open for callers to extend) */
  actions?: DataTableCustomAction<TData>[];
};

type ResolvedAction = {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'destructive';
  separatorBefore?: boolean;
};

function resolveActions<TData>({
  row,
  editable,
  deletable,
  onEdit,
  onDelete,
  actions,
  editLabel,
  deleteLabel,
}: {
  row: TData;
  editable?: boolean;
  deletable?: boolean;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  actions: DataTableCustomAction<TData>[];
  editLabel: string;
  deleteLabel: string;
}): ResolvedAction[] {
  const items: ResolvedAction[] = actions.map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    variant: action.variant,
    separatorBefore: action.separatorBefore,
    onClick: () => action.onClick(row),
  }));

  if (editable && onEdit) {
    items.push({
      id: 'edit',
      label: editLabel,
      icon: <Icon name="pencil-line" />,
      onClick: () => onEdit(row),
    });
  }

  if (deletable && onDelete) {
    items.push({
      id: 'delete',
      label: deleteLabel,
      icon: <Icon name="delete-bin-line" />,
      variant: 'destructive',
      separatorBefore: items.length > 0,
      onClick: () => onDelete(row),
    });
  }

  return items;
}

function RowActionsMenu({ items }: { items: ResolvedAction[] }) {
  const { t } = useTranslation();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 p-0"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="sr-only">{t('common.openMenu')}</span>
          <Icon name="more-2-line" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
        <DropdownMenuLabel>{t('common.actions')}</DropdownMenuLabel>
        {items.map((action) => (
          <div key={action.id}>
            {action.separatorBefore && <DropdownMenuSeparator />}
            <DropdownMenuItem
              className={
                action.variant === 'destructive'
                  ? 'text-destructive focus:text-destructive'
                  : undefined
              }
              onClick={action.onClick}
            >
              {action.icon}
              {action.label}
            </DropdownMenuItem>
          </div>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function RowActionsInline({ items }: { items: ResolvedAction[] }) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      {items.map((action) => (
        <Tooltip key={action.id}>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={cn(
                'h-8 w-8',
                action.variant === 'destructive' &&
                  'text-destructive hover:text-destructive',
              )}
              onClick={(e) => {
                e.stopPropagation();
                action.onClick();
              }}
              aria-label={action.label}
            >
              {action.icon ?? action.label}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{action.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

export function DataTableRowActions<TData>({
  row,
  editable = false,
  deletable = false,
  menu = true,
  onEdit,
  onDelete,
  actions = [],
}: DataTableRowActionsProps<TData>) {
  const { t } = useTranslation();
  const items = resolveActions({
    row,
    editable,
    deletable,
    onEdit,
    onDelete,
    actions,
    editLabel: t('common.edit'),
    deleteLabel: t('common.delete'),
  });

  if (items.length === 0) return null;

  return menu ? (
    <RowActionsMenu items={items} />
  ) : (
    <RowActionsInline items={items} />
  );
}

export type CreateActionsColumnOptions<TData> = {
  editable?: boolean;
  deletable?: boolean;
  /**
   * `true` — 3-dot dropdown menu.
   * `false` — inline action buttons in the row.
   * @default true
   */
  menu?: boolean;
  onEdit?: (row: TData) => void;
  onDelete?: (row: TData) => void;
  actions?:
    | DataTableCustomAction<TData>[]
    | ((row: TData) => DataTableCustomAction<TData>[]);
};

/** Static actions column — enable edit/delete via flags; pass `actions` for custom items. */
export function createActionsColumn<TData>(
  options: CreateActionsColumnOptions<TData> = {},
): ColumnDef<TData> {
  const {
    editable = false,
    deletable = false,
    menu = true,
    onEdit,
    onDelete,
    actions,
  } = options;

  return {
    id: 'actions',
    enableHiding: false,
    enableSorting: false,
    cell: ({ row }) => {
      const custom =
        typeof actions === 'function' ? actions(row.original) : actions;
      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DataTableRowActions
            row={row.original}
            editable={editable}
            deletable={deletable}
            menu={menu}
            onEdit={onEdit}
            onDelete={onDelete}
            actions={custom}
          />
        </div>
      );
    },
  };
}
