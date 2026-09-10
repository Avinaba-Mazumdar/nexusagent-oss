import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004182] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer active:scale-[0.98]',
    {
        variants: {
            variant: {
                default: 'bg-[#004ea1] text-white shadow-xs hover:bg-[#003673]',
                dark: 'bg-[#1e232a] text-white shadow-xs hover:bg-[#0a0d12]',
                soft: 'bg-[#e8f3fc] text-[#004182] border border-[#93c5fd] hover:bg-[#d8ecf9]',
                secondary: 'bg-[#f1f5f9] text-[#0f172a] border border-[#cbd5e1] hover:bg-[#e2e8f0]',
                outline: 'border border-[#94a3b8] bg-white text-[#0f172a] shadow-xs hover:bg-[#f8fafc]',
                ghost: 'hover:bg-[#f1f5f9] text-[#1e293b] hover:text-[#0f172a]',
                destructive: 'bg-[#991b1b] text-white shadow-xs hover:bg-[#7f1d1d]',
                link: 'text-[#004ea1] underline-offset-4 hover:underline'
            },
            size: {
                default: 'min-h-[44px] px-4 py-2.5',
                sm: 'min-h-[36px] px-3.5 py-1.5 text-xs rounded-lg',
                lg: 'min-h-[48px] px-6 py-3 text-base',
                icon: 'min-h-[44px] min-w-[44px] rounded-xl',
                'icon-sm': 'min-h-[36px] min-w-[36px] rounded-lg'
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
