import * as React from 'react';
import { cn } from '../utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', error = false, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'w-full bg-[#FAF8F5] border border-[#E8E4DE] text-[#2E2E38] placeholder:text-[#9A9AA2] rounded-input px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#2E2E38] focus:border-[#2E2E38]',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
