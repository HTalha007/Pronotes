import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';

    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-btn transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none select-none';

    const variants = {
      primary: 'bg-[#2E2E38] dark:bg-[#EDEDF0] text-white dark:text-[#18181B] hover:bg-[#3D3D4A] dark:hover:bg-[#FFFFFF] shadow-sm',
      secondary: 'bg-[#FAF8F5] dark:bg-[#282833] text-[#2E2E38] dark:text-[#EDEDF0] border border-[#E8E4DE] dark:border-[#3F3F4E] hover:bg-[#F0EDE8] dark:hover:bg-[#32323D]',
      ghost: 'text-[#2E2E38] dark:text-[#EDEDF0] hover:bg-[#F4F2EE] dark:hover:bg-[#282833]',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm',
      outline: 'border border-[#E8E4DE] dark:border-[#3F3F4E] text-[#2E2E38] dark:text-[#EDEDF0] hover:bg-[#FAF8F5] dark:hover:bg-[#282833]'
    };

    const sizes = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
      md: 'text-sm px-3.5 py-2 gap-2 h-9',
      lg: 'text-base px-5 py-2.5 gap-2.5 h-11',
      icon: 'h-9 w-9 p-0'
    };

    return (
      <Comp
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
