import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-slate-900 text-white hover:bg-slate-900/90',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-100/80',
  destructive: 'bg-red-500 text-white hover:bg-red-500/90',
  outline: 'border border-slate-200 text-slate-900'
};

type BadgeVariant = keyof typeof variants;

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
