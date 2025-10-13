import * as React from 'react';

interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'destructive' | 'warning';
}

export function Alert({ className = '', variant = 'default', ...props }: AlertProps) {
  let variantClass = 'ui-alert';
  if (variant === 'destructive') {
    variantClass = 'ui-alert ui-alert--destructive';
  } else if (variant === 'warning') {
    variantClass = 'ui-alert ui-alert--warning';
  }
  return <div role="alert" className={`${variantClass} ${className}`.trim()} {...props} />;
}

export function AlertTitle({ className = '', ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={`${'ui-alert-title'} ${className}`.trim()} {...props} />;
}

export function AlertDescription({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`${'ui-alert-description'} ${className}`.trim()} {...props} />;
}
