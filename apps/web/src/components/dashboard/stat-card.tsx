'use client';

import { type LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { Card, CardContent } from '@/components/ui/card';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: { value: number; isPositive: boolean };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div
                className={cn(
                  'flex items-center gap-1 text-xs font-medium',
                  trend.isPositive ? 'text-green-600' : 'text-red-600'
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                <span>
                  {trend.isPositive ? '+' : ''}
                  {trend.value}%
                </span>
              </div>
            )}
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
