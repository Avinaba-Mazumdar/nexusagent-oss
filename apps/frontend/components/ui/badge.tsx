import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                soft: 'border-accent-foreground/20 bg-accent text-accent-foreground',
                secondary: 'border-border bg-secondary text-secondary-foreground',
                success: 'border-success-border bg-success-bg text-success',
                warning: 'border-warning-border bg-warning-bg text-warning',
                destructive: 'border-destructive/30 bg-destructive/15 text-destructive',
                dark: 'border-border bg-dark-pill text-white',
                outline: 'border-border bg-card text-card-foreground',
                citation: 'border-citation-border bg-citation-bg text-citation-text font-mono hover:opacity-90 transition-opacity cursor-pointer shadow-2xs'
            }
        },
        defaultVariants: {
            variant: 'default'
        }
    }
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
