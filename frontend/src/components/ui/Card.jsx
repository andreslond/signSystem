import React from 'react';
import { cn } from '../../utils/cn';

export function Card({ className, children, ...props }) {
    return (
        <div
            className={cn(
                'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ className, children, ...props }) {
    return (
        <div className={cn('px-6 py-4 border-b border-gray-50', className)} {...props}>
            {children}
        </div>
    );
}

export function CardBody({ className, children, ...props }) {
    return (
        <div className={cn('p-6', className)} {...props}>
            {children}
        </div>
    );
}
