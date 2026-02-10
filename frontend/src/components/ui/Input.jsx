import React from 'react';
import { cn } from '../../utils/cn';

export const Input = React.forwardRef(({ className, ...props }, ref) => {
    return (
        <input
            ref={ref}
            className={cn(
                'block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border transition-colors',
                className
            )}
            {...props}
        />
    );
});

Input.displayName = 'Input';
