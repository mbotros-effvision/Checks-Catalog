import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// shadcn-style Button, themed with the app's existing CSS-variable tokens.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-1.5 rounded-md font-semibold whitespace-nowrap transition-all cursor-pointer disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-soft',
  {
    variants: {
      variant: {
        default: 'bg-accent text-white border border-accent hover:brightness-110',
        outline: 'border border-line-strong bg-surface text-muted hover:border-accent hover:text-accent',
        ghost: 'bg-transparent text-muted hover:bg-surface-2 hover:text-ink',
        destructive: 'border border-[#fca5a5] bg-surface text-[#b91c1c] hover:bg-[#fee2e2]',
      },
      size: {
        sm: 'h-7 px-2.5 text-[11px]',
        default: 'h-8 px-3.5 text-xs',
        icon: 'h-7 w-7 p-0',
      },
    },
    defaultVariants: { variant: 'outline', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

export { buttonVariants };
