import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[#004182] focus:ring-offset-1',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-[#004ea1] text-white',
                soft: 'border-[#93c5fd] bg-[#e8f3fc] text-[#004182]',
                secondary: 'border-[#cbd5e1] bg-[#f1f5f9] text-[#1e293b]',
                success: 'border-[#86efac] bg-[#ecfdf5] text-[#14532d]',
                warning: 'border-[#fcd34d] bg-[#fffbeb] text-[#78350f]',
                destructive: 'border-[#fca5a5] bg-[#fef2f2] text-[#991b1b]',
                dark: 'border-transparent bg-[#1e232a] text-white',
                outline: 'border-[#94a3b8] bg-white text-[#0f172a]',
                citation: 'border-[#93c5fd] bg-[#e8f3fc] text-[#004182] font-mono hover:bg-[#d8ecf9] transition-colors cursor-pointer shadow-2xs'
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
