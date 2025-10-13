import * as React from 'react';

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
}

export function Separator({ className = '', orientation = 'horizontal', ...props }: SeparatorProps) {
  const orientationClass = orientation === 'horizontal' ? 'ui-separator-horizontal' : 'ui-separator-vertical';
  return <div role="separator" aria-orientation={orientation} className={`${orientationClass} ${className}`.trim()} {...props} />;
}
