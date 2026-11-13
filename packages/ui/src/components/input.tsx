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
          'w-full bg-[#FAF8F5] dark:bg-[#282833] border border-[#E8E4DE] dark:border-[#3F3F4E] text-[#2E2E38] dark:text-[#EDEDF0] placeholder:text-[#9A9AA2] dark:placeholder:text-[#71717A] rounded-input px-3.5 py-2 text-sm transition-colors focus:outline-none focus:ring-1 focus:ring-[#2E2E38] dark:focus:ring-[#EDEDF0] focus:border-[#2E2E38] dark:focus:border-[#EDEDF0]',
          error && 'border-red-500 focus:ring-red-500 focus:border-red-500',
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';
