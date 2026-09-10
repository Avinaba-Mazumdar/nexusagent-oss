'use client';

import * as React from 'react';
import * as SwitchPrimitives from '@radix-ui/react-switch';
import { cn } from '@/lib/utils';

const Switch = React.forwardRef<React.ElementRef<typeof SwitchPrimitives.Root>, React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>>(
    ({ className, ...props }, ref) => (
        <div className="inline-flex items-center justify-center min-h-[44px] min-w-[44px]">
            <SwitchPrimitives.Root
                className={cn(
                    'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#004182] disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-[#004ea1] data-[state=unchecked]:bg-[#64748b]',
                    className
                )}
                {...props}
                ref={ref}
            >
                <SwitchPrimitives.Thumb
                    className={cn(
                        'pointer-events-none block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0'
                    )}
                />
            </SwitchPrimitives.Root>
        </div>
    )
);
Switch.displayName = SwitchPrimitives.Root.displayName;

export { Switch };
