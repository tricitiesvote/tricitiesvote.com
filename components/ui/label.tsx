import * as React from 'react';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = '', ...props }, ref) => (
    <label ref={ref} className={`ui-label ${className}`.trim()} {...props} />
  )
);

Label.displayName = 'Label';
