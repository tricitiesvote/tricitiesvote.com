import * as React from 'react';

type ButtonVariant = 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = '', variant = 'default', size = 'default', type = 'button', ...props }, ref) => {
    const classes = ['ui-button', `ui-button--${variant}`, `ui-button-size-${size}`, className]
      .filter(Boolean)
      .join(' ');

    return <button type={type} ref={ref} className={classes} {...props} />;
  }
);

Button.displayName = 'Button';
