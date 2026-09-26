import { cn } from '@/lib/utils';

export type RemixIconName = string;

type IconProps = {
  /** Remix Icon name with or without `ri-` prefix, e.g. `add-line` or `ri-add-line` */
  name: RemixIconName;
  className?: string;
  title?: string;
};

export function Icon({ name, className, title }: IconProps) {
  const ri = name.startsWith('ri-') ? name : `ri-${name}`;
  return (
    <i
      className={cn(ri, 'inline-flex shrink-0 leading-none', className)}
      aria-hidden={title ? undefined : true}
      title={title}
      role={title ? 'img' : undefined}
    />
  );
}
