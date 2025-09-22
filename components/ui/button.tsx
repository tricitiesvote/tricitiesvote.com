import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

const variantClasses: Record<ButtonVariant, string> = {
  default: 'bg-slate-900 text-white hover:bg-slate-800 focus-visible:ring-slate-900/60',
  secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200 focus-visible:ring-slate-200/80',
  outline: 'border border-slate-200 text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-200/80',
  ghost: 'text-slate-900 hover:bg-slate-100 focus-visible:ring-slate-200/80',
  destructive: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/60'
};

const sizeClasses: Record<ButtonSize, string> = {
  default: 'px-4 py-2 h-10',
  sm: 'px-3 py-1.5 h-9 text-sm',
  lg: 'px-5 py-3 h-11 text-base',
  icon: 'h-10 w-10'
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', ...props }, ref) => (
    <button
      type={type}
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  )
);

Button.displayName = 'Button';
