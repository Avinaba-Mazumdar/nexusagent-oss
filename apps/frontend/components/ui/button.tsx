import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]',
    {
        variants: {
            variant: {
                default: 'bg-primary text-primary-foreground font-semibold shadow hover:bg-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.25)]',
                emerald: 'bg-accent text-accent-foreground font-semibold shadow hover:bg-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.25)]',
                secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-slate-700/80 border border-white/5',
                outline: 'border border-border bg-transparent shadow-sm hover:bg-secondary hover:text-foreground',
                ghost: 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground',
                destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-rose-600',
                glass: 'glass-panel text-foreground shadow-sm hover:bg-white/5 hover:border-white/20',
                link: 'text-primary underline-offset-4 hover:underline'
            },
            size: {
                default: 'h-9 px-4 py-2',
                sm: 'h-8 rounded-md px-3 text-xs',
                lg: 'h-10 rounded-md px-6 text-base',
                icon: 'h-9 w-9',
                'icon-sm': 'h-7 w-7'
            }
        },
        defaultVariants: {
            variant: 'default',
            size: 'default'
        }
    }
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = 'Button';

export { Button, buttonVariants };
