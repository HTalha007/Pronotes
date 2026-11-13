import * as React from 'react';
import { cn } from '../utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'vault' | 'subtle';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-[#F4F2EE] dark:bg-[#282833] text-[#2E2E38] dark:text-[#EDEDF0] border border-[#E8E4DE] dark:border-[#3F3F4E]',
    vault: 'bg-[#E8ECFB] dark:bg-[#1E294A] text-[#2F3A6B] dark:text-[#93A5F8] border border-[#D0D9F5] dark:border-[#2D3E70]',
    subtle: 'bg-[#FAF8F5] dark:bg-[#282833] text-[#6B6B76] dark:text-[#A1A1AA] border border-[#E8E4DE] dark:border-[#3F3F4E]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
