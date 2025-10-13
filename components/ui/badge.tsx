const variants = {
  default: 'ui-badge ui-badge--default',
  secondary: 'ui-badge ui-badge--secondary',
  destructive: 'ui-badge ui-badge--destructive',
  outline: 'ui-badge ui-badge--outline'
};

type BadgeVariant = keyof typeof variants;

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
  return <div className={`${variants[variant]} ${className}`.trim()} {...props} />;
}
