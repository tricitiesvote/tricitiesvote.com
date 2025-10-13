import * as React from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', children, ...props }, ref) => (
    <select ref={ref} className={`ui-select ${className}`.trim()} {...props}>
      {children}
    </select>
  )
);

Select.displayName = 'Select';
