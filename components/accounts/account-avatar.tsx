import { Icon } from '@/components/ui/icon';
import type { Account } from '@/lib/types';
import { cn } from '@/lib/utils';

const SIZES = {
  sm: 'size-6 rounded-md text-xs',
  md: 'size-8 rounded-lg text-sm',
  lg: 'size-12 rounded-xl text-xl',
} as const;

export function AccountAvatar({
  account,
  size = 'md',
  className,
}: {
  account: Pick<Account, 'name' | 'icon' | 'color'>;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const initial = account.name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center font-semibold text-white shadow-sm',
        SIZES[size],
        className,
      )}
      style={{ backgroundColor: account.color }}
    >
      {account.icon ? <Icon name={account.icon} /> : initial}
    </span>
  );
}
