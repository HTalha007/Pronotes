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
    default: 'bg-[#F4F2EE] text-[#2E2E38] border border-[#E8E4DE]',
    vault: 'bg-[#E8ECFB] text-[#2F3A6B] border border-[#D0D9F5]',
    subtle: 'bg-[#FAF8F5] text-[#6B6B76] border border-[#E8E4DE]',
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
