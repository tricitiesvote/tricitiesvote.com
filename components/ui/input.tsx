import * as React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', ...props }, ref) => (
    <input ref={ref} type={type} className={`ui-input ${className}`.trim()} {...props} />
  )
);

Input.displayName = 'Input';
