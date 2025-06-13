import * as React from 'react';
import { Card } from './card';
import { cn } from '@/lib/utils';

export interface PanelCardProps
  extends React.ComponentPropsWithoutRef<typeof Card> {}

const PanelCard = React.forwardRef<HTMLDivElement, PanelCardProps>(
  ({ className, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        'bg-white/90 backdrop-blur-xl shadow-xl border-0 rounded-2xl overflow-hidden',
        className
      )}
      {...props}
    />
  )
);
PanelCard.displayName = 'PanelCard';

export { PanelCard };
