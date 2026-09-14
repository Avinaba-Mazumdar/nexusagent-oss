import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#004182] dark:focus:ring-ring focus:ring-offset-1',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                soft: 'border-[#93c5fd] bg-[#e8f3fc] text-[#004182] dark:border-border dark:bg-accent dark:text-accent-foreground',
                secondary: 'border-[#cbd5e1] bg-[#f1f5f9] text-[#1e293b] dark:border-border dark:bg-secondary dark:text-secondary-foreground',
                success: 'border-[#86efac] bg-[#ecfdf5] text-[#14532d] dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400',
                warning: 'border-[#fcd34d] bg-[#fffbeb] text-[#78350f] dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-400',
                destructive: 'border-[#fca5a5] bg-[#fef2f2] text-[#991b1b] dark:border-destructive/30 dark:bg-destructive/15 dark:text-destructive',
                dark: 'border-transparent bg-[#1e232a] dark:bg-slate-800 text-white',
                outline: 'border-[#94a3b8] bg-white text-[#0f172a] dark:border-border dark:bg-card dark:text-card-foreground',
                citation:
                    'border-[#93c5fd] bg-[#e8f3fc] text-[#004182] dark:border-primary/30 dark:bg-accent dark:text-accent-foreground font-mono hover:bg-[#d8ecf9] dark:hover:bg-accent/80 transition-colors cursor-pointer shadow-2xs'
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
