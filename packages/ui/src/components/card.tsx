import * as React from 'react';
import { cn } from '../utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  color?: string;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, color, style, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        style={{ ...style, backgroundColor: color || undefined }}
        className={cn(
          'group relative bg-white dark:bg-[#272730] border border-[#E8E4DE] dark:border-[#3F3F4E] rounded-card p-4 transition-all duration-200 hover:shadow-md hover:border-[#D5D0C8] dark:hover:border-[#525266] cursor-pointer flex flex-col',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
